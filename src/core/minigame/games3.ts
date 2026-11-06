// More games for the minigame framework: Pokéathlon obstacle course (S437, S486), Bug Contest (S445), Puzzle Slots (S446),
// Dance Battle (S451), Pinball Bonus (S453), Ranger Styler (S493) and Snap Photo (S494). Same rules as the others:
// plain JSON state, own seeded generator inside the state, nothing touches the gameplay RNG streams.

import { Rng } from '../rng';
import type { BaseState, Cell, MinigameModule } from './games';

const base = (rs: BaseState['rs']): BaseState => ({ rs, done: false, msg: '', tick: 0 });
const rng = (s: BaseState) => new Rng(s.rs);
const keep = (s: BaseState, r: Rng) => void (s.rs = r.state);

// ---------- Pokéathlon obstacle course (S437) with the five-stat layer (S486) ----------
const ATH_STATS = ['Speed', 'Power', 'Skill', 'Stamina', 'Jump'] as const;
const OBSTACLES = ['Hurdles (Jump)', 'Boulder push (Power)', 'Balance beam (Skill)', 'Sprint lane (Speed)', 'Long haul (Stamina)'] as const;
interface AthState extends BaseState {
  stats: number[];
  course: number[];
  at: number;
  energy: number;
  rests: number;
  cleared: number;
}
const athlete: MinigameModule<AthState> = {
  start(_c, p, rs) {
    const r = new Rng(rs);
    // A stat profile that always adds up to 12 (each 1 to 4), so no run is lopsided beyond the layer.
    const stats = [1, 1, 1, 1, 1];
    for (let left = 7; left > 0; ) {
      const i = r.int(0, 4);
      if (stats[i]! < 4) {
        stats[i]! += 1;
        left -= 1;
      }
    }
    const course = Array.from({ length: p.length! }, () => r.int(0, 4));
    return { ...base(r.state), stats, course, at: 0, energy: p.energy!, rests: 2, cleared: 0 };
  },
  view(_c, s) {
    const cur = s.course[s.at];
    const cells: Cell[] = ATH_STATS.map((n, i) => ({ id: String(i), label: n, detail: `${s.stats[i]}`, tone: i === cur ? ('hot' as const) : ('info' as const), disabled: s.done }));
    cells.push({ id: 'rest', label: 'Rest', detail: `+2 energy (${s.rests} left)`, tone: 'dim', disabled: s.done || s.rests <= 0 });
    return {
      hud: [`Obstacle ${Math.min(s.at + 1, s.course.length)}/${s.course.length}`, `Cleared: ${s.cleared}`, `Energy: ${s.energy}`, s.msg],
      prompt: cur === undefined ? 'The course is done.' : `Next: ${OBSTACLES[cur]}. Use the stat that fits (cost 1 energy). Other stats can still try.`,
      cols: 3,
      cells,
      done: s.done,
    };
  },
  act(_c, s, id) {
    if (s.done) return;
    if (id === 'rest') {
      if (s.rests <= 0) return;
      s.rests -= 1;
      s.energy += 2;
      s.msg = 'You catch your breath.';
      return;
    }
    if (s.energy <= 0) return;
    const i = Number(id);
    const need = s.course[s.at]!;
    s.energy -= 1;
    const r = rng(s);
    const roll = r.int(0, 2);
    keep(s, r);
    const power = s.stats[i]! + roll + (i === need ? 2 : 0);
    if (power >= 5) {
      s.cleared += 1;
      s.msg = 'Cleared it!';
    } else s.msg = 'Stumbled over it.';
    s.at += 1;
    if (s.at >= s.course.length || (s.energy <= 0 && s.rests <= 0)) s.done = true;
  },
  result: (s) => ({ score: s.cleared, max: s.course.length }),
};

// ---------- Bug Contest (S445): judged on size, rarity and health ----------
const BUGS = [
  { n: 'Caterpie', rare: 1 }, { n: 'Weedle', rare: 1 }, { n: 'Pinsir', rare: 4 }, { n: 'Scyther', rare: 4 },
  { n: 'Heracross', rare: 4 }, { n: 'Butterfree', rare: 3 }, { n: 'Beedrill', rare: 3 }, { n: 'Venonat', rare: 2 },
  { n: 'Paras', rare: 2 }, { n: 'Ledyba', rare: 1 },
] as const;
const SPOTS = ['Tall grass', 'Old tree', 'Flower bed', 'Log pile', 'Pond edge', 'Rock crack'];
interface BugState extends BaseState {
  turns: number;
  found: number;
  held: { n: string; pts: number } | null;
  last: { n: string; pts: number } | null;
}
const bugContest: MinigameModule<BugState> = {
  start: (_c, p, rs) => ({ ...base(rs), turns: p.turns!, found: 0, held: null, last: null }),
  view(_c, s) {
    const cells: Cell[] = SPOTS.map((n, i) => ({ id: `spot${i}`, label: n, tone: 'info' as const, disabled: s.done || !!s.last }));
    if (s.last) {
      cells.length = 0;
      cells.push({ id: 'keep', label: `Keep ${s.last.n} (${s.last.pts})`, tone: 'good', disabled: s.done }, { id: 'release', label: 'Let it go', tone: 'dim', disabled: s.done });
    }
    return {
      hud: [`Searches left: ${s.turns}`, `In your cage: ${s.held ? `${s.held.n} (${s.held.pts})` : 'nothing'}`, s.msg],
      prompt: s.last ? `A ${s.last.n} worth ${s.last.pts} points! Keep it (replacing the cage bug) or release it?` : 'Search a spot. The judges score the best bug in your cage.',
      cols: s.last ? 2 : 3,
      cells,
      done: s.done,
    };
  },
  act(_c, s, id) {
    if (s.done) return;
    if (id.startsWith('spot') && !s.last) {
      const r = rng(s);
      const bug = r.pick([...BUGS]);
      const size = r.int(1, 5);
      const health = r.int(1, 5);
      keep(s, r);
      s.turns -= 1;
      s.last = { n: bug.n, pts: bug.rare * 3 + size + health };
      s.msg = `Found a ${bug.n}.`;
    } else if (id === 'keep' && s.last) {
      if (!s.held || s.last.pts > s.held.pts) s.held = s.last;
      s.last = null;
    } else if (id === 'release') s.last = null;
    if (!s.last && s.turns <= 0) s.done = true;
  },
  result: (s) => ({ score: s.held?.pts ?? 0, max: 25 }),
};

// ---------- Puzzle Slots (S446): line up the reels by turning them, no luck in the payout ----------
const SYMS = ['7', 'Cherry', 'Bell', 'Star'] as const;
const REELS = 4;
interface SlotState extends BaseState {
  off: number[];
  moves: number;
}
const rows = (s: SlotState): string[][] => Array.from({ length: REELS }, (_, row) => s.off.map((o) => SYMS[(row + o) % REELS]!));
const slotScore = (s: SlotState): number =>
  rows(s).reduce((n, row) => {
    const same = new Set(row).size;
    return n + (same === 1 ? 3 : same === 2 ? 1 : 0);
  }, 0);
const slots: MinigameModule<SlotState> = {
  start(_c, p, rs) {
    const r = new Rng(rs);
    const off = Array.from({ length: REELS }, () => r.int(0, REELS - 1));
    const need = off.reduce((n, o) => n + ((REELS - ((o - off[0]! + REELS) % REELS)) % REELS), 0);
    return { ...base(r.state), off, moves: need + 1 + p.slack! };
  },
  view(_c, s) {
    const grid = rows(s);
    const cells: Cell[] = Array.from({ length: REELS }, (_, c) => c).map((c) => ({ id: `turn${c}`, label: `Turn reel ${c + 1}`, tone: 'hot' as const, disabled: s.done }));
    for (const row of grid) for (const sym of row) cells.push({ id: 'x', label: sym, tone: new Set(row).size === 1 ? ('good' as const) : ('dim' as const), disabled: true });
    return { hud: [`Turns left: ${s.moves}`, `Score: ${slotScore(s)}/${REELS * 3}`, s.msg], prompt: 'Turn the reels so each row shows one symbol. Three alike scores 3, two alike scores 1.', cols: REELS, cells, done: s.done };
  },
  act(_c, s, id) {
    if (s.done || !id.startsWith('turn')) return;
    const c = Number(id.slice(4));
    s.off[c] = (s.off[c]! + 1) % REELS;
    s.moves -= 1;
    s.msg = slotScore(s) === REELS * 3 ? 'Jackpot!' : '';
    if (s.moves <= 0 || slotScore(s) === REELS * 3) s.done = true;
  },
  result: (s) => ({ score: slotScore(s), max: REELS * 3 }),
};

// ---------- Dance Battle (S451): copy the rival's routine; each round adds a step ----------
const DANCE = ['Up', 'Down', 'Left', 'Right'] as const;
interface DanceState extends BaseState {
  seq: number[];
  round: number;
  rounds: number;
  show: number;
  input: number;
  lives: number;
  won: number;
}
const newRoutine = (s: DanceState): void => {
  const r = rng(s);
  s.seq = Array.from({ length: s.round + 2 }, () => r.int(0, 3));
  keep(s, r);
  s.show = 0;
  s.input = 0;
};
const dance: MinigameModule<DanceState> = {
  start(_c, p, rs) {
    const s: DanceState = { ...base(rs), seq: [], round: 0, rounds: p.rounds!, show: 0, input: 0, lives: p.lives!, won: 0 };
    newRoutine(s);
    return s;
  },
  view(_c, s) {
    const showing = s.show < s.seq.length;
    return {
      hud: [`Round ${Math.min(s.round + 1, s.rounds)}/${s.rounds}`, `Routines matched: ${s.won}`, `Lives: ${s.lives}`, s.msg],
      prompt: showing ? `Watch the rival: ${s.seq.slice(0, s.show).map((i) => DANCE[i]).join(' · ') || '...'}` : `Your turn: step ${s.input + 1} of ${s.seq.length}.`,
      cols: 2,
      cells: DANCE.map((n, i) => ({ id: String(i), label: n, tone: 'info' as const, disabled: s.done || showing })),
      done: s.done,
    };
  },
  tick(_c, s) {
    if (!s.done && s.show < s.seq.length) s.show += 1;
  },
  act(_c, s, id) {
    if (s.done || s.show < s.seq.length) return;
    if (Number(id) === s.seq[s.input]) {
      s.input += 1;
      if (s.input >= s.seq.length) {
        s.won += 1;
        s.msg = 'Routine matched!';
        endDanceRound(s);
      }
    } else {
      s.lives -= 1;
      s.msg = 'Off the beat.';
      if (s.lives <= 0) s.done = true;
      else endDanceRound(s);
    }
  },
  result: (s) => ({ score: s.won, max: s.rounds }),
};
function endDanceRound(s: DanceState): void {
  s.round += 1;
  if (s.round >= s.rounds) s.done = true;
  else newRoutine(s);
}

// ---------- Pinball Bonus (S453): keep the ball alive, hit the bumpers ----------
const PIN_W = 5;
const PIN_H = 7;
interface PinState extends BaseState {
  bumpers: number[];
  col: number;
  row: number;
  dir: number;
  up: boolean;
  flip: number;
  balls: number;
  points: number;
  target: number;
  ticks: number;
}
const pinball: MinigameModule<PinState> = {
  start(_c, p, rs) {
    const r = new Rng(rs);
    const bumpers = r.shuffle(Array.from({ length: (PIN_H - 2) * PIN_W }, (_, i) => i + PIN_W)).slice(0, 7);
    return { ...base(r.state), bumpers, col: 2, row: 0, dir: 1, up: false, flip: 2, balls: p.balls!, points: 0, target: p.target!, ticks: p.ticks! };
  },
  view(_c, s) {
    const cells: Cell[] = [];
    for (let row = 0; row < PIN_H; row++) {
      for (let c = 0; c < PIN_W; c++) {
        const ball = row === s.row && c === s.col;
        const flip = row === PIN_H - 1;
        cells.push({
          id: flip ? String(c) : 'x',
          label: ball ? '●' : flip ? (c === s.flip ? '▬' : '·') : s.bumpers.includes(row * PIN_W + c) ? '◆' : ' ',
          tone: ball ? 'hot' : flip && c === s.flip ? 'good' : s.bumpers.includes(row * PIN_W + c) ? 'info' : 'dim',
          disabled: s.done || !flip,
        });
      }
    }
    return { hud: [`Points: ${s.points}`, `Balls: ${s.balls}`, `Time: ${s.ticks}`, s.msg], prompt: 'Tap the bottom row to move the flipper under the ball. Bumpers (◆) score 2.', cols: PIN_W, cells, done: s.done };
  },
  act(_c, s, id) {
    if (!s.done && id !== 'x') s.flip = Number(id);
  },
  tick(_c, s) {
    if (s.done) return;
    s.ticks -= 1;
    s.row += s.up ? -1 : 1;
    s.col += s.dir;
    if (s.col < 0 || s.col >= PIN_W) {
      s.dir = -s.dir;
      s.col += 2 * s.dir;
    }
    if (s.row <= 0) {
      s.row = 0;
      s.up = false;
    }
    if (s.bumpers.includes(s.row * PIN_W + s.col)) {
      s.points += 2;
      s.dir = -s.dir;
      s.msg = 'Bumper!';
    }
    if (s.row >= PIN_H - 1) {
      if (Math.abs(s.flip - s.col) <= 0) {
        s.up = true;
        s.points += 1;
        s.dir = s.flip < 2 ? 1 : s.flip > 2 ? -1 : s.dir;
        s.msg = 'Saved!';
      } else {
        s.balls -= 1;
        s.row = 0;
        s.col = 2;
        s.msg = 'Ball lost.';
      }
    }
    if (s.balls <= 0 || s.ticks <= 0) s.done = true;
  },
  result: (s) => ({ score: Math.min(s.points, s.target), max: s.target }),
};

// ---------- Ranger Styler (S493): draw capture loops around the wild Pokémon ----------
const RING = 8;
interface StylerState extends BaseState {
  start: number;
  next: number;
  loops: number;
  need: number;
  hp: number;
  ticks: number;
}
const styler: MinigameModule<StylerState> = {
  start: (_c, p, rs) => ({ ...base(rs), start: 0, next: 0, loops: 0, need: p.loops!, hp: p.hp!, ticks: p.ticks! }),
  view(_c, s) {
    const order = (i: number) => (i - s.start + RING) % RING;
    const cells: Cell[] = [];
    // The ring around the Pokémon, clockwise from the top left; the middle cell is the Pokémon.
    const around = [0, 1, 2, 5, 8, 7, 6, 3];
    for (let g = 0; g < 9; g++) {
      const ring = around.indexOf(g);
      if (ring < 0) {
        cells.push({ id: 'x', label: '☺', tone: 'hot', disabled: true });
        continue;
      }
      const o = order(ring);
      cells.push({ id: String(ring), label: o < s.next ? '✔' : o === s.next ? '→' : `${o + 1}`, tone: o < s.next ? 'good' : o === s.next ? 'hot' : 'info', disabled: s.done });
    }
    return { hud: [`Loops: ${s.loops}/${s.need}`, `Styler: ${s.hp}`, `Time: ${s.ticks}`, s.msg], prompt: 'Tap the points around the Pokémon in order to draw a loop. A wrong point breaks the line.', cols: 3, cells, done: s.done };
  },
  act(_c, s, id) {
    if (s.done || id === 'x') return;
    const o = (Number(id) - s.start + RING) % RING;
    if (o === s.next) {
      s.next += 1;
      if (s.next >= RING) {
        s.loops += 1;
        s.next = 0;
        s.msg = 'Loop closed!';
        if (s.loops >= s.need) s.done = true;
      }
    } else {
      s.hp -= 1;
      s.next = 0;
      s.msg = 'The line broke!';
      if (s.hp <= 0) s.done = true;
    }
  },
  tick(_c, s) {
    if (s.done) return;
    s.ticks -= 1;
    // The Pokémon dashes: the loop start moves and the half-drawn loop is lost (no penalty).
    if (s.tick++ % 5 === 4) {
      const r = rng(s);
      s.start = r.int(0, RING - 1);
      keep(s, r);
      s.next = 0;
      s.msg = 'It dashed away!';
    }
    if (s.ticks <= 0) s.done = true;
  },
  result: (s) => ({ score: Math.min(s.loops, s.need), max: s.need }),
};

// ---------- Snap Photo (S494): the request changes every shot; centre it and pick the right subject ----------
const SUBJECTS = ['Fire', 'Water', 'Grass', 'Electric', 'Ghost', 'Psychic'];
interface SnapState extends BaseState {
  film: number;
  ask: number;
  spots: (number | null)[];
  points: number;
  shots: number;
}
const populate = (s: SnapState): void => {
  const r = rng(s);
  s.spots = Array.from({ length: 9 }, () => (r.chance(0.45) ? r.int(0, SUBJECTS.length - 1) : null));
  s.ask = r.int(0, SUBJECTS.length - 1);
  if (!s.spots.includes(s.ask)) s.spots[r.int(0, 8)] = s.ask;
  keep(s, r);
};
const snap: MinigameModule<SnapState> = {
  start(_c, p, rs) {
    const s: SnapState = { ...base(rs), film: p.film!, ask: 0, spots: [], points: 0, shots: p.film! };
    populate(s);
    return s;
  },
  view(_c, s) {
    return {
      hud: [`Film: ${s.film}`, `Score: ${s.points}`, s.msg],
      prompt: `The dex wants a photo of a ${SUBJECTS[s.ask]}-type. Tap a frame to shoot (the centre frame scores most).`,
      cols: 3,
      cells: s.spots.map((t, i) => ({ id: String(i), label: t === null ? ' ' : SUBJECTS[t]!, tone: t === s.ask ? ('hot' as const) : t === null ? ('dim' as const) : ('info' as const), disabled: s.done })),
      done: s.done,
    };
  },
  act(_c, s, id) {
    if (s.done) return;
    const i = Number(id);
    const t = s.spots[i];
    s.film -= 1;
    if (t === s.ask) {
      const gain = i === 4 ? 3 : 2;
      s.points += gain;
      s.msg = `Great shot! +${gain}`;
    } else s.msg = t === null ? 'Nothing there.' : 'Wrong type.';
    if (s.film <= 0) s.done = true;
    else populate(s);
  },
  tick(_c, s) {
    if (!s.done) populate(s);
  },
  result: (s) => ({ score: Math.min(s.points, s.shots * 3), max: s.shots * 3 }),
};

// ---------- Pokémon Contest (S487): appeal in the judged condition; repeating one wears the judges out ----------
const COND = ['Cool', 'Beauty', 'Cute', 'Smart', 'Tough'] as const;
interface ContestState extends BaseState {
  cond: number[];
  judge: number[];
  round: number;
  last: number;
  points: number;
  best: number;
}
const contest: MinigameModule<ContestState> = {
  start(_c, p, rs) {
    const r = new Rng(rs);
    const rounds = p.rounds!;
    const judge = Array.from({ length: rounds }, () => r.int(0, 4));
    const cond = [p.c0 ?? 0, p.c1 ?? 0, p.c2 ?? 0, p.c3 ?? 0, p.c4 ?? 0];
    return { ...base(r.state), cond, judge, round: 0, last: -1, points: 0, best: rounds * (p.base! + 2 + 6 + p.bonus!) };
  },
  view(_c, s) {
    return {
      hud: [`Round ${Math.min(s.round + 1, s.judge.length)}/${s.judge.length}`, `Points: ${s.points}`, `Conditions: ${s.cond.map((v, i) => `${COND[i]} ${v}`).join(', ')}`, s.msg],
      prompt: `The judges want ${COND[s.judge[s.round] ?? 0]} this round. Pick your appeal; repeating the last appeal scores less. Feed Poffins (Berry Blending) to raise your lead's conditions.`,
      cols: 5,
      cells: COND.map((n, i) => ({ id: String(i), label: n, detail: `${s.cond[i]}`, tone: i === s.judge[s.round] ? ('hot' as const) : ('info' as const), disabled: s.done })),
      done: s.done,
    };
  },
  act(_c, s, id) {
    if (s.done) return;
    const i = Number(id);
    const r = rng(s);
    const flair = r.int(0, 2);
    keep(s, r);
    const match = i === s.judge[s.round];
    let pts = 2 + s.cond[i]! + flair + (match ? 6 : 0);
    if (i === s.last) pts = Math.ceil(pts / 2);
    s.points += pts;
    s.msg = `${COND[i]} appeal: +${pts}${match ? ' (just what they wanted!)' : ''}`;
    s.last = i;
    s.round += 1;
    if (s.round >= s.judge.length) s.done = true;
  },
  // `max` is generous: a very well-fed lead scores near it, an unfed one reaches roughly half.
  result: (s) => ({ score: Math.min(s.points, s.best), max: s.best }),
};

export const MINIGAMES_3: Record<string, MinigameModule<never>> = {
  'obstacle-course': athlete as never,
  'bug-contest': bugContest as never,
  'puzzle-slots': slots as never,
  'dance-battle': dance as never,
  'pinball-bonus': pinball as never,
  'ranger-styler': styler as never,
  'snap-photo': snap as never,
  'pokemon-contest': contest as never,
};
