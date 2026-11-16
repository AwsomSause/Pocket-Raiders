// Greenneedle gn.18, Safari Land: a walkable zone played as a minigame (the map stop `gn-safari`). 30 Safari Balls, 500 steps, no
// battles. Four areas, the Quiet meter (0 to 10), the families, the herds at the waterhole, the migration, a rare Dragonair at high Quiet,
// and three small games inside it: photography, tracking and feeding. Every roll is the game's own seeded stream (minigame state `rs`),
// so a reload or a replay lands the same. What was caught, the nest egg, the photo money and the warden's verdict apply once, when it ends.

import type { Content } from '../contentSchema';
import { Rng } from '../rng';
import type { RunState } from '../state';
import { isNative, typesPool } from '../themes';
import type { BaseState, MinigameModule, MinigameView, Cell } from '../minigame/games';

export const SAFARI_ID = 'gn-safari';

export const AREAS = ['The Gatehouse Plain', 'The Waterhole', 'The Long Grass', 'The Far Marsh'] as const;
/** The doc's residents of each area (missing species are skipped). */
const RESIDENTS: readonly (readonly string[])[] = [
  ['tauros', 'ponyta', 'doduo', 'nidoran-f', 'nidoran-m'],
  ['rhyhorn', 'psyduck', 'slowpoke', 'marill'],
  ['scyther', 'pinsir', 'exeggcute', 'venonat', 'paras'],
  ['dratini', 'chansey', 'poliwag', 'wooper'],
];
/** The types each area draws on from the region's own pool. */
const AREA_TYPES: readonly (readonly string[])[] = [['normal', 'ground'], ['water', 'ground'], ['bug', 'grass'], ['water', 'dragon']];
/** 8%: a "star" Pokémon. 2%: one with a regional or Delta form. */
const STARS = ['chansey', 'kangaskhan', 'tauros', 'scyther', 'pinsir', 'dratini', 'dragonair', 'heracross'];
const FORMS = ['ponyta-galar', 'slowpoke-galar', 'exeggutor-alola', 'tauros-paldea-combat', 'wooper-paldea', 'grimer-delta', 'muk-delta', 'marowak-alola', 'raichu-alola'];
const BEHAVIOURS = ['grazing', 'feeding', 'playing', 'sleeping'] as const;
type Behaviour = (typeof BEHAVIOURS)[number];
/** Feeding: what it does, and the food that is right for it. */
const HUNGER = [
  { tell: 'It keeps pawing the ground.', food: 'roots' },
  { tell: 'It keeps looking up into the branches.', food: 'fruit' },
  { tell: 'It keeps sniffing at the water.', food: 'weed' },
] as const;
const PRINTS = ['Three-toed prints', 'Round pads', 'Drag marks'] as const;
/** The nest at the end of the tracks, by area (the Long Grass and the Far Marsh). */
const NEST: Record<number, string> = { 2: 'exeggcute', 3: 'dratini' };

const STEPS = { walk: 10, run: 5, wait: 3, look: 5, move: 20, act: 2, track: 5, lost: 15 } as const;

interface Encounter {
  species: string;
  catchP: number;
  fleeP: number;
  behaviour: Behaviour;
  noticed: boolean;
  star: boolean;
  /** Won't eat: the HUNGER index, until it is fed (or the wrong food is offered). */
  hungry: number | null;
  fed: boolean;
  dragonair: boolean;
}

export interface SafariState extends BaseState {
  area: number;
  steps: number;
  balls: number;
  quiet: number;
  walks: number;
  waits: number;
  mode: 'walk' | 'meet' | 'family' | 'herd' | 'migration' | 'track' | 'nest';
  mon: Encounter | null;
  caught: string[];
  /** The region's own residents of each area (set when the game starts; empty in a test without a run). */
  local: string[][];
  camera: boolean;
  shots: number;
  photoBest: number;
  photoMoney: number;
  familySeen: boolean;
  plainWalks: number;
  herd: 'rhyhorn' | 'tauros' | 'none' | null;
  herdWaits: number;
  migration: number;
  migrationSeen: boolean;
  dragonairSeen: boolean;
  /** Binoculars in the Long Grass: the next one met is feeding and hasn't seen you. */
  feedingNext: boolean;
  tracked: boolean;
  track: { print: number; fork: number; right: number[] } | null;
  egg: string | null;
  nestLeft: boolean;
  farGate: boolean;
  /** The warden's running commentary. */
  warden: string;
}

const rng = (s: BaseState) => new Rng(s.rs);
const keep = (s: BaseState, r: Rng) => void (s.rs = r.state);
const clampQ = (n: number) => Math.max(0, Math.min(10, n));
const pct = (p: number) => `${Math.round(p * 100)}%`;
const nameOf = (content: Content, id: string) => content.species.get(id)?.name ?? id;

const WARDEN_WALK = [
  'And here... nothing at all. Marvellous. Nothing is the hardest thing to film.',
  'The trainer walks. Slowly. That\'s it. That\'s all you have to do.',
  'Listen. No. Listen properly.',
];
const WARDEN_RUN = 'The trainer approaches. Slowly. Slower than that. No. Well. There it goes.';
const WARDEN_WAIT = 'Standing still. Good. Most people never learn it.';

function setWarden(s: SafariState, line: string): void {
  s.warden = `Warden: "${line}"`;
}

function poolOf(content: Content, s: SafariState): string[] {
  let own = RESIDENTS[s.area]!.filter((id) => content.species.has(id));
  if (s.area === 1 && s.herd === 'rhyhorn') own = [...own.filter((id) => id !== 'tauros'), 'rhyhorn', 'rhyhorn'];
  if (s.area === 1 && s.herd === 'tauros') own = [...own.filter((id) => id !== 'rhyhorn'), 'tauros', 'tauros', 'tauros'];
  return [...own, ...(s.local[s.area] ?? [])];
}

/** Something comes out of the grass (or doesn't). `unnoticed`: you came quietly. */
function meet(content: Content, s: SafariState, r: Rng, unnoticed: boolean): void {
  let species: string;
  let star = false;
  let dragonair = false;
  if (s.area === 3 && s.quiet >= 8 && !s.dragonairSeen && content.species.has('dragonair')) {
    species = 'dragonair';
    dragonair = true;
    s.dragonairSeen = true;
  } else if (s.migration > 0) {
    s.migration -= 1;
    species = r.pick(RESIDENTS[3]!.filter((id) => content.species.has(id)));
  } else {
    const roll = r.float();
    const stars = STARS.filter((id) => content.species.has(id));
    const forms = FORMS.filter((id) => content.species.has(id));
    if (roll < 0.08 && stars.length) {
      species = r.pick(stars);
      star = true;
    } else if (roll < 0.1 && forms.length) species = r.pick(forms);
    else species = r.pick(poolOf(content, s));
  }
  const behaviour: Behaviour = dragonair ? 'sleeping' : s.feedingNext ? 'feeding' : r.pick([...BEHAVIOURS]);
  const quietBonus = s.quiet >= 8 ? 0.1 : 0;
  const mon: Encounter = {
    species,
    catchP: Math.min(0.95, (dragonair ? 0.25 : star ? 0.15 : 0.3) + quietBonus),
    fleeP: dragonair ? 0.02 : 0.12 + (s.quiet <= 3 ? 0.25 : 0),
    behaviour,
    noticed: !(unnoticed || s.feedingNext || dragonair),
    star,
    hungry: !star && !dragonair && r.chance(0.125) ? r.int(0, HUNGER.length - 1) : null,
    fed: false,
    dragonair,
  };
  s.feedingNext = false;
  // Quiet 0 to 3: Pokémon bolt on sight.
  if (s.quiet <= 3 && !dragonair && r.chance(0.5)) {
    s.msg = `A ${nameOf(content, species)} sees you, and bolts.`;
    setWarden(s, 'Gone. You could hear that one coming from the gate.');
    return;
  }
  s.mon = mon;
  s.mode = 'meet';
  s.msg = dragonair ? 'A Dragonair, asleep on a rock in the marsh. It hasn\'t seen you.' : `A wild ${nameOf(content, species)}${star ? ' (a rare one!)' : ''}, ${behaviour}.`;
  if (dragonair) setWarden(s, 'Oh. Oh, look at that. Nobody sees that. Don\'t breathe.');
}

/** After bait, a rock or a miss: it may wander off. */
function maybeFlee(content: Content, s: SafariState, r: Rng): void {
  if (s.mon && r.chance(s.mon.fleeP)) {
    s.msg = `The ${nameOf(content, s.mon.species)} wandered off.`;
    s.mon = null;
    s.mode = 'walk';
  }
}

function photoScore(s: SafariState): number {
  const m = s.mon!;
  const behaviour = m.behaviour === 'grazing' ? 1 : 2;
  return Math.max(1, behaviour + (m.noticed ? 0 : 2) + (s.quiet >= 8 ? 1 : 0) + (m.star || m.dragonair ? 2 : 0));
}

function sellShot(s: SafariState, score: number): void {
  s.shots += 1;
  s.photoBest = Math.max(s.photoBest, score);
  if (score >= 3) s.photoMoney += score * 80;
}

function enterArea(s: SafariState, area: number): void {
  s.area = area;
  s.mon = null;
  s.mode = 'walk';
  if (area === 1 && s.herd === null) {
    s.mode = 'herd';
    s.msg = 'Two herds at the waterhole: Rhyhorn on one bank, Tauros on the other. Nobody is drinking.';
    setWarden(s, 'A dispute. Wait, and one of them will back down. Throw anything and nobody will.');
  } else if (area === 3 && !s.migrationSeen) {
    s.migrationSeen = true;
    s.mode = 'migration';
    s.msg = 'The ground shakes. A migration is starting, here in the marsh, and it is going to cross the whole park.';
    setWarden(s, 'Once a visit. Once. Look up from the Balls for a minute.');
  } else s.msg = `${AREAS[area]}.`;
}

function finish(s: SafariState): void {
  s.done = true;
  s.mon = null;
}

const safari: MinigameModule<SafariState> = {
  start(_c, p, rs) {
    return {
      rs, done: false, msg: 'The Gatehouse Plain. The grass is long and the sky is very big.', tick: 0,
      area: 0, steps: p.steps ?? 500, balls: p.balls ?? 30, quiet: clampQ(p.quiet ?? 0), walks: 0, waits: 0, mode: 'walk', mon: null, caught: [], local: [[], [], [], []],
      camera: false, shots: 0, photoBest: 0, photoMoney: 0, familySeen: false, plainWalks: 0, herd: null, herdWaits: 0, migration: 0, migrationSeen: false,
      dragonairSeen: false, feedingNext: false, tracked: false, track: null, egg: null, nestLeft: false, farGate: false,
      warden: 'Warden: "And here... the Rhyhorn. Forty stone of bad temper. Watch. It\'s going to do nothing at all. Marvellous."',
    };
  },
  view(content, s) {
    const hud = [`${AREAS[s.area]}`, `Steps: ${s.steps}`, `Safari Balls: ${s.balls}`, `Quiet: ${s.quiet}/10`, `Caught: ${s.caught.length}`, s.msg, s.warden];
    const cells: Cell[] = [];
    const c = (id: string, label: string, detail: string, tone: Cell['tone'] = 'info', disabled = false) => cells.push({ id, label, detail, tone, disabled: s.done || disabled });
    let prompt = 'Walk, wait or watch. Quiet rises when you are careful.';
    if (s.mode === 'meet' && s.mon) {
      const m = s.mon;
      prompt = `${nameOf(content, m.species)}: catch ${pct(m.catchP)}, wanders off ${pct(m.fleeP)}.${m.hungry !== null && !m.fed ? ` It won't eat. ${HUNGER[m.hungry]!.tell}` : ''}`;
      c('ball', 'Throw a Ball', `catch ${pct(m.catchP)}`, 'hot', s.balls <= 0);
      c('bait', 'Throw bait', 'easier to catch, likelier to wander off');
      c('rock', 'Throw a rock', 'harder to catch, less likely to leave', 'bad');
      c('leave', 'Leave', 'let it be', 'dim');
      if (s.camera) c('photo', 'Take a photo', m.noticed ? 'it has seen you' : 'it hasn\'t seen you', 'good');
      if (m.hungry !== null && !m.fed) for (const food of ['roots', 'fruit', 'weed']) c(`feed:${food}`, `Offer ${food}`, 'pick from how it behaves', 'good');
      return { hud, prompt, cols: 3, cells, done: s.done };
    }
    if (s.mode === 'family') {
      prompt = 'A Kangaskhan and its young cross the plain. The young one is out of the pouch.';
      c('ball', 'Throw a Ball', 'Not while the young one\'s out of the pouch', 'dim', true);
      c('watch', 'Watch', 'Quiet +1', 'good');
      c('closer', 'Step closer', 'Quiet -2', 'bad');
      if (s.camera) c('photo', 'Take a photo', 'the young one, out of the pouch', 'hot');
      c('leave', 'Walk on', 'let them pass', 'dim');
      return { hud, prompt, cols: 3, cells, done: s.done };
    }
    if (s.mode === 'herd') {
      prompt = `Rhyhorn on one bank, Tauros on the other. Waited: ${s.herdWaits} of 3.`;
      c('wait', 'Wait', 'three steps, no throwing', 'good');
      c('rock', 'Throw a rock', 'Quiet -1', 'bad');
      c('leave', 'Walk on', 'leave them to it', 'dim');
      return { hud, prompt, cols: 3, cells, done: s.done };
    }
    if (s.mode === 'migration') {
      prompt = 'The migration crosses the marsh and heads for the plain.';
      c('watch', 'Watch', 'Quiet +1', 'good');
      if (s.camera) c('photo', 'Take a photo', 'the whole herd, on the move', 'hot');
      c('leave', 'Walk on', 'they will be all over the park for a while', 'dim');
      return { hud, prompt, cols: 3, cells, done: s.done };
    }
    if (s.mode === 'track' && s.track) {
      prompt = `You are following ${PRINTS[s.track.print]!.toLowerCase()}. A fork (${s.track.fork + 1} of 2): which prints go on?`;
      PRINTS.forEach((label, i) => c(`print:${i}`, label, `${STEPS.track} steps`));
      return { hud, prompt, cols: 3, cells, done: s.done };
    }
    if (s.mode === 'nest') {
      prompt = `A nest, hidden in the ${s.area === 2 ? 'long grass' : 'reeds'}. An egg in it, warm.`;
      c('take', 'Take an egg', 'it hatches later', 'hot');
      c('leaveNest', 'Leave it', 'Quiet +2; the warden notices', 'good');
      return { hud, prompt, cols: 2, cells, done: s.done };
    }
    c('walk', 'Walk', `${STEPS.walk} steps; Quiet rises`, 'good');
    c('run', 'Run', `${STEPS.run} steps; Quiet -1`, 'bad');
    c('wait', 'Wait', `${STEPS.wait} steps; Quiet +1`, 'good');
    c('look', 'Use the binoculars', `${STEPS.look} steps; Quiet +1`, 'info');
    if (s.area === 0 && !s.camera) c('camera', 'Borrow the camera', 'the warden buys good shots', 'hot');
    if ((s.area === 2 || s.area === 3) && !s.tracked) c('track', 'Follow the prints', 'to a nest, across two forks', 'info');
    if (s.area < 3) c('next', `On to ${AREAS[s.area + 1]}`, `${STEPS.move} steps`, 'info');
    if (s.area > 0) c('back', `Back to ${AREAS[s.area - 1]}`, `${STEPS.move} steps`, 'dim');
    if (s.area === 3) c('far', 'Go through the far gate', 'the wild beyond the park', 'hot');
    c('exit', 'Leave the park', 'end the visit', 'dim');
    return { hud, prompt, cols: 3, cells, done: s.done } satisfies MinigameView;
  },
  act(content, s, id) {
    if (s.done) return;
    const r = rng(s);
    if (s.mode === 'meet' && s.mon) {
      const m = s.mon;
      s.steps -= STEPS.act;
      if (id === 'ball' && s.balls > 0) {
        s.balls -= 1;
        if (r.chance(m.catchP)) {
          s.caught.push(m.species);
          s.msg = `Caught! ${nameOf(content, m.species)} is yours.`;
          setWarden(s, m.dragonair ? 'Well. I didn\'t think I\'d live to see that.' : 'And that, for the record, is how it\'s done.');
          s.mon = null;
          s.mode = 'walk';
        } else {
          s.quiet = clampQ(s.quiet - 1);
          s.msg = 'It broke free!';
          maybeFlee(content, s, r);
        }
      } else if (id === 'bait') {
        m.catchP = Math.min(0.95, m.catchP + 0.15);
        m.fleeP = Math.min(0.9, m.fleeP + 0.1);
        s.msg = 'It eats the bait, and looks about for more.';
        maybeFlee(content, s, r);
      } else if (id === 'rock') {
        m.catchP = Math.max(0.05, m.catchP - 0.1);
        m.fleeP = Math.max(0.02, m.fleeP - 0.1);
        s.quiet = clampQ(s.quiet - 1);
        s.msg = 'It glares at you and digs in.';
        setWarden(s, 'A rock. In my park.');
        maybeFlee(content, s, r);
      } else if (id === 'photo' && s.camera) {
        const score = photoScore(s);
        sellShot(s, score);
        s.msg = `Click. A ${score}-point shot${score >= 3 ? ' the warden will buy' : ''}.`;
        m.noticed = true;
        m.fleeP = Math.min(0.9, m.fleeP + 0.05);
        maybeFlee(content, s, r);
      } else if (id.startsWith('feed:') && m.hungry !== null && !m.fed) {
        const right = id === `feed:${HUNGER[m.hungry]!.food}`;
        m.fed = true;
        if (right && s.quiet >= 8) {
          s.caught.push(m.species);
          s.msg = `It eats from your hand, then simply follows you. ${nameOf(content, m.species)} will walk with you to the gate.`;
          s.mon = null;
          s.mode = 'walk';
        } else if (right) {
          m.catchP = Math.min(0.95, m.catchP * 2);
          s.msg = 'It eats. It looks at you differently now. Its catch chance doubles.';
        } else {
          m.fleeP = Math.min(0.9, m.fleeP + 0.1);
          s.msg = 'It turns its nose up.';
          maybeFlee(content, s, r);
        }
      } else if (id === 'leave') {
        s.msg = 'You leave it be.';
        s.mon = null;
        s.mode = 'walk';
      }
    } else if (s.mode === 'family') {
      s.steps -= STEPS.wait;
      if (id === 'watch') {
        s.quiet = clampQ(s.quiet + 1);
        s.msg = 'The young one tumbles out, climbs back in, tumbles out again.';
        setWarden(s, 'Nobody throws anything at a family. Not in my park.');
      } else if (id === 'closer') {
        s.quiet = clampQ(s.quiet - 2);
        s.msg = 'The mother turns and stares you down. They hurry on.';
        s.mode = 'walk';
      } else if (id === 'photo' && s.camera) {
        sellShot(s, 10);
        s.msg = 'Click. The young one, out of the pouch, looking straight at its mother. A 10-point shot.';
        setWarden(s, 'That one goes on the wall.');
      } else if (id === 'leave') {
        s.msg = 'They pass. The grass closes behind them.';
        s.mode = 'walk';
      }
    } else if (s.mode === 'herd') {
      s.steps -= STEPS.wait;
      if (id === 'wait') {
        s.herdWaits += 1;
        s.quiet = clampQ(s.quiet + 1);
        if (s.herdWaits >= 3) {
          s.herd = r.chance(0.5) ? 'rhyhorn' : 'tauros';
          s.msg = s.herd === 'rhyhorn' ? 'The Tauros back down and wander off. The Rhyhorn drink.' : 'The Rhyhorn grumble and turn away. The Tauros wade in.';
          setWarden(s, 'There. Patience. The waterhole decides who drinks.');
          s.mode = 'walk';
        } else s.msg = 'Nobody moves. You don\'t either.';
      } else {
        s.herd = 'none';
        if (id === 'rock') s.quiet = clampQ(s.quiet - 1);
        s.msg = 'Both herds scatter. Nobody drinks today.';
        s.mode = 'walk';
      }
    } else if (s.mode === 'migration') {
      s.steps -= STEPS.wait;
      s.migration = 3;
      if (id === 'watch') {
        s.quiet = clampQ(s.quiet + 1);
        s.msg = 'They go past for a long time. You stop counting.';
      } else if (id === 'photo' && s.camera) {
        sellShot(s, 6);
        s.msg = 'Click. The whole herd, on the move. A 6-point shot.';
      } else s.msg = 'You walk on. Behind you, the marsh is emptying.';
      s.mode = 'walk';
    } else if (s.mode === 'track' && s.track && id.startsWith('print:')) {
      s.steps -= STEPS.track;
      const t = s.track;
      if (Number(id.slice(6)) === t.right[t.fork]) {
        t.fork += 1;
        if (t.fork >= 2) {
          s.mode = 'nest';
          s.track = null;
          s.msg = 'The prints end at a nest.';
        } else s.msg = 'The prints go on.';
      } else {
        s.steps -= STEPS.lost;
        s.track = null;
        s.mode = 'walk';
        s.msg = 'The prints peter out. You\'ve lost the trail.';
      }
    } else if (s.mode === 'nest') {
      s.steps -= STEPS.act;
      if (id === 'take') {
        s.egg = NEST[s.area] ?? 'exeggcute';
        s.msg = 'You take one egg, carefully, and leave the rest.';
      } else {
        s.nestLeft = true;
        s.quiet = clampQ(s.quiet + 2);
        s.msg = 'You leave it. You back away the way you came.';
        setWarden(s, 'I saw that. I won\'t say anything. I saw it, though.');
      }
      s.mode = 'walk';
    } else {
      switch (id) {
        case 'walk': {
          s.steps -= STEPS.walk;
          s.walks += 1;
          if (s.walks % 2 === 0) s.quiet = clampQ(s.quiet + 1);
          setWarden(s, WARDEN_WALK[s.walks % WARDEN_WALK.length]!);
          if (s.area === 0) s.plainWalks += 1;
          // A Kangaskhan and its young cross the plain once a visit, on the second walk there.
          if (s.area === 0 && !s.familySeen && s.plainWalks >= 2 && content.species.has('kangaskhan')) {
            s.familySeen = true;
            s.mode = 'family';
            s.msg = 'A Kangaskhan and its young are crossing the plain.';
          } else if (r.chance(0.6)) meet(content, s, r, false);
          else s.msg = 'Nothing. Long grass, moving in the wind.';
          break;
        }
        case 'run':
          s.steps -= STEPS.run;
          s.quiet = clampQ(s.quiet - 1);
          setWarden(s, WARDEN_RUN);
          if (r.chance(0.9)) meet(content, s, r, false);
          break;
        case 'wait':
          s.steps -= STEPS.wait;
          s.waits += 1;
          s.quiet = clampQ(s.quiet + 1);
          setWarden(s, WARDEN_WAIT);
          if (r.chance(0.3)) meet(content, s, r, true);
          else s.msg = 'You stand still. The park forgets you\'re there.';
          break;
        case 'look':
          s.steps -= STEPS.look;
          s.quiet = clampQ(s.quiet + 1);
          if (s.area === 2) {
            s.feedingNext = true;
            s.msg = 'From far off: a Scyther sharpening its blades on a stone. It only does it when nobody\'s close.';
          } else if (s.area === 3) s.msg = 'Through the binoculars: reeds pressed flat in a ring. A nest, somewhere in there.';
          else if (s.area === 1) s.msg = 'Through the binoculars: a Psyduck holding its head, at the edge of the water.';
          else s.msg = 'Through the binoculars: grazers, all facing the same way, into the wind.';
          break;
        case 'camera':
          s.camera = true;
          s.steps -= 1;
          s.msg = 'The gatehouse camera. The warden buys good shots: distance, behaviour, and whether it saw you.';
          break;
        case 'track':
          s.steps -= STEPS.track;
          s.tracked = true;
          s.mode = 'track';
          s.track = { print: r.int(0, PRINTS.length - 1), fork: 0, right: [] };
          // The trail you started on is the trail that goes on.
          s.track.right = [s.track.print, s.track.print];
          s.msg = `You find ${PRINTS[s.track.print]!.toLowerCase()} in the mud and follow them.`;
          break;
        case 'next':
          s.steps -= STEPS.move;
          enterArea(s, Math.min(3, s.area + 1));
          break;
        case 'back':
          s.steps -= STEPS.move;
          enterArea(s, Math.max(0, s.area - 1));
          break;
        case 'far':
          s.farGate = true;
          s.msg = 'At the far gate.';
          setWarden(s, 'Beyond here, it isn\'t a park. Nobody\'s counting your steps. Nobody\'s coming to fetch you, either.');
          finish(s);
          break;
        case 'exit':
          s.steps -= 1;
          finish(s);
          break;
        default:
          break;
      }
    }
    keep(s, r);
    if (s.steps <= 0) {
      s.steps = 0;
      s.msg = 'Out of steps. The warden is waiting for you at the gate.';
      finish(s);
    }
  },
  result: (s) => ({ score: Math.min(30, s.caught.length), max: 30 }),
};

export const SAFARI_GAMES: Record<string, MinigameModule<never>> = { [SAFARI_ID]: safari as never };

/** The region's own residents for each area: up to four native species of the area's types, drawn by the game's stream. */
export function safariLocal(content: Content, run: Pick<RunState, 'regionOrder' | 'regionIndex'>, r: Rng): string[][] {
  const regionId = run.regionOrder[run.regionIndex];
  return AREA_TYPES.map((types, area) => {
    const own = new Set(RESIDENTS[area]);
    const native = typesPool(content, types as never, regionId)
      .filter((p) => !own.has(p.speciesId) && content.species.has(p.speciesId) && isNative(content, content.species.get(p.speciesId)!, regionId))
      .map((p) => p.speciesId)
      .sort();
    return r.shuffle(native).slice(0, 4);
  });
}

/** The warden's verdict by the Quiet you ended on. */
export function wardenVerdict(quiet: number): string {
  if (quiet >= 8) return 'Warden: "You were barely here. That\'s the highest thing I know how to say." A second visit, free, any time this region.';
  if (quiet >= 4) return 'Warden: "Fair enough."';
  return 'Warden: "The Rhyhorn\'s going to be upset for a week." The entry fee is ₽800 next time.';
}
