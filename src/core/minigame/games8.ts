// Beta 0.6 minigames, batch 5 and 6: Debate (a quiz of arguments) and Safari Trek (tracking then a photo). Pure state
// machines with their own seeded generator; nothing touches the gameplay RNG streams.

import { Rng } from '../rng';
import type { BaseState, Cell, MinigameModule } from './games';

const base = (rs: BaseState['rs']): BaseState => ({ rs, done: false, msg: '', tick: 0 });

// ---------- Debate ----------
const ARGS = ['Facts', 'Heart', 'Humor'] as const;
/** Each argument beats one kind of crowd and is weak against another: Facts > Skeptic, Heart > Kind, Humor > Stern. */
const CROWDS = ['Skeptic', 'Kind', 'Stern'] as const;
const TOPICS = ['Should Pokémon nap in class?', 'Is the Poké Ball fair?', 'Are gyms too hard?', 'Is the Safari Zone cruel?', 'Should rivals share berries?', 'Do wild Pokémon need passports?', 'Is rain better than sun?', 'Should Snorlax block roads?'];
interface DebateState extends BaseState {
  rounds: { topic: string; crowd: number; pick: number | null }[];
  at: number;
  mood: number;
  score: number;
  /** How many times each argument may be used (a limited supply forces planning). */
  uses: number[];
}
const debate: MinigameModule<DebateState> = {
  start(_c, p, rs) {
    const r = new Rng(rs);
    const topics = r.shuffle([...TOPICS]);
    const rounds = Array.from({ length: p.rounds! }, (_, i) => ({ topic: topics[i % topics.length]!, crowd: r.int(0, 2), pick: null as number | null }));
    return { ...base(r.state), rounds, at: 0, mood: p.mood!, score: 0, uses: [p.uses!, p.uses!, p.uses!] };
  },
  view(_c, s) {
    const round = s.rounds[s.at];
    const cells: Cell[] = ARGS.map((n, i) => ({ id: String(i), label: n, detail: `${s.uses[i]} left`, tone: 'info', disabled: s.done || (s.uses[i] ?? 0) <= 0 }));
    return {
      hud: [`Round ${Math.min(s.at + 1, s.rounds.length)}/${s.rounds.length}`, `Crowd mood: ${s.mood}`, `Points: ${s.score}`, s.msg],
      prompt: round ? `"${round.topic}" The crowd looks ${CROWDS[round.crowd]!.toLowerCase()}. Pick your argument.` : 'The debate is over.',
      cols: 3,
      cells,
      done: s.done,
    };
  },
  act(_c, s, id) {
    const i = Number(id);
    const round = s.rounds[s.at];
    if (s.done || !round || !s.uses[i]) return;
    s.uses[i]! -= 1;
    round.pick = i;
    if (i === round.crowd) {
      s.score += 2;
      s.mood += 1;
      s.msg = 'The crowd cheers!';
    } else if ((i + 1) % 3 === round.crowd) {
      s.score += 1;
      s.msg = 'Some nods.';
    } else {
      s.mood -= 1;
      s.msg = 'The crowd frowns.';
    }
    s.at += 1;
    if (s.at >= s.rounds.length || s.mood <= 0) s.done = true;
  },
  result: (s) => ({ score: s.score, max: s.rounds.length * 2 }),
};

// ---------- Safari Trek ----------
const TREK_W = 3;
interface TrekState extends BaseState {
  /** The route the target took: one lane (0-2) per leg. */
  route: number[];
  clues: (number | null)[];
  at: number;
  steps: number;
  found: number;
  photo: number;
  phase: 'track' | 'photo';
  /** Photo: the frame (0-8) the Pokémon is in, and how many shots remain. */
  target: number;
  film: number;
  shots: number;
}
const trek: MinigameModule<TrekState> = {
  start(_c, p, rs) {
    const r = new Rng(rs);
    const route = Array.from({ length: p.legs! }, () => r.int(0, TREK_W - 1));
    // A clue is a footprint in the right lane; some legs have a false print in another lane.
    const clues = route.map((l) => (r.chance(p.clueChance! / 100) ? l : null));
    return { ...base(r.state), route, clues, at: 0, steps: p.steps!, found: 0, photo: 0, phase: 'track', target: 4, film: p.film!, shots: p.film! };
  },
  view(_c, s) {
    const cells: Cell[] = [];
    if (s.phase === 'track') {
      for (let l = 0; l < TREK_W; l++) cells.push({ id: String(l), label: `Path ${l + 1}`, detail: s.clues[s.at] === l ? 'footprints' : '', tone: s.clues[s.at] === l ? 'good' : 'info', disabled: s.done });
      return { hud: [`Leg ${Math.min(s.at + 1, s.route.length)}/${s.route.length}`, `Steps left: ${s.steps}`, s.msg], prompt: 'Follow the tracks. Pick the path the Pokémon took. No footprints? Guess.', cols: TREK_W, cells, done: s.done };
    }
    for (let i = 0; i < 9; i++) cells.push({ id: `f${i}`, label: i === 4 ? '◎' : '·', tone: 'dim', disabled: s.done });
    return { hud: [`Film: ${s.film}`, `Photo score: ${s.photo}`, s.msg], prompt: 'You found it! Frame the shot: the centre frame is best.', cols: 3, cells, done: s.done };
  },
  act(_c, s, id) {
    if (s.done) return;
    if (s.phase === 'track') {
      const l = Number(id);
      if (!Number.isInteger(l) || l < 0 || l >= TREK_W || s.steps <= 0) return;
      s.steps -= 1;
      if (l === s.route[s.at]) {
        s.found += 1;
        s.at += 1;
        s.msg = 'Right way.';
        if (s.at >= s.route.length) {
          s.phase = 'photo';
          s.msg = 'There it is!';
        }
      } else s.msg = 'Dead end.';
      if (s.phase === 'track' && s.steps <= 0) s.done = true;
      return;
    }
    if (!id.startsWith('f') || s.film <= 0) return;
    const i = Number(id.slice(1));
    s.film -= 1;
    // The Pokémon drifts: a shot in the centre scores 3, beside it 1.
    const pts = i === 4 ? 3 : [1, 3, 5, 7].includes(i) ? 1 : 0;
    s.photo += pts;
    s.msg = pts === 3 ? 'Perfect shot!' : pts ? 'Decent shot.' : 'Missed.';
    if (s.film <= 0) s.done = true;
  },
  result: (s) => ({ score: s.found + s.photo, max: s.route.length + s.shots * 3 }),
};

export const MINIGAMES_8: Record<string, MinigameModule<never>> = {
  'debate-club': debate as never,
  'safari-trek': trek as never,
};
