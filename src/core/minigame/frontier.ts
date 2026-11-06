// Battle Frontier facilities (S439 to S443) as minigames: Factory (rentals), Palace (a lineup it plays on its own),
// Pyramid (fog floors with hidden trainers) and Arcade (spun modifiers). Fights run on the real battle engine through
// `fight` (core/exhibition), seeded from the game's own state, so nothing touches the gameplay RNG streams.

import type { Content } from '../contentSchema';
import { natureName, NATURE_IDS } from '../natures';
import { fight, palaceStyle, type ExhibitionFighter, type ExhibitionTeam } from '../exhibition';
import { Rng } from '../rng';
import type { BaseState, Cell, MinigameModule } from './games';

const base = (rs: BaseState['rs']): BaseState => ({ rs, done: false, msg: '', tick: 0 });
const rng = (s: BaseState) => new Rng(s.rs);
const keep = (s: BaseState, r: Rng) => void (s.rs = r.state);

const finals = (c: Content): string[] => [...c.species.values()].filter((sp) => !sp.id.includes('-') && sp.evolutions.length === 0).map((sp) => sp.id);
function draw(c: Content, r: Rng, n: number, level: number): ExhibitionFighter[] {
  return r.shuffle(finals(c)).slice(0, n).map((id) => ({ speciesId: id, name: c.species.get(id)?.name ?? id, level }));
}
const label = (f: ExhibitionFighter) => `${f.name} Lv${f.level}`;
const TRAINERS = ['Frontier Brain', 'Tower Tycoon', 'Factory Head', 'Palace Maven', 'Pyramid King', 'Arcade Star', 'Hall Matron'];

/** Fights one round: your three against a fresh team. True when you win. */
function duel(c: Content, s: FrontState, mine: ExhibitionFighter[], foeLevel: number, palaceRules = false): boolean {
  const r = rng(s);
  const foe: ExhibitionTeam = { trainer: r.pick(TRAINERS), fighters: draw(c, r, 3, foeLevel) };
  keep(s, r);
  s.fights += 1;
  const res = fight(c, s.fseed, `f${s.fights}`, { trainer: 'You', fighters: mine }, foe, { palace: palaceRules });
  s.msg = res.winner === 0 ? `Round won against ${foe.trainer}.` : `Lost to ${foe.trainer}.`;
  return res.winner === 0;
}

interface FrontState extends BaseState {
  fseed: string;
  fights: number;
  level: number;
  round: number;
  rounds: number;
  won: number;
  pool: ExhibitionFighter[];
  team: number[];
  phase: 'pick' | 'between';
}
const roundLevel = (s: FrontState) => s.level + s.round * 2;
const poolCells = (s: FrontState, id: (i: number) => string): Cell[] =>
  s.pool.map((f, i) => ({ id: id(i), label: f.name, detail: `Lv${f.level}`, tone: s.team.includes(i) ? ('good' as const) : ('info' as const), disabled: s.done }));
function startFront(c: Content, p: Record<string, number>, rs: BaseState['rs'], poolSize: number): FrontState {
  const r = new Rng(rs);
  const fseed = String(r.int(0, 1_000_000_000));
  const pool = draw(c, r, poolSize, p.level!);
  return { ...base(r.state), fseed, fights: 0, level: p.level!, round: 0, rounds: p.rounds!, won: 0, pool, team: [], phase: 'pick' };
}
function finishRound(s: FrontState, win: boolean) {
  if (!win) return void (s.done = true);
  s.won += 1;
  s.round += 1;
  if (s.round >= s.rounds) s.done = true;
}

// ---------- Battle Factory (S440): borrowed teams on rental ----------
const factory: MinigameModule<FrontState> = {
  start: (c, p, rs) => startFront(c, p, rs, 6),
  view(_c, s) {
    const hud = [`Round ${Math.min(s.round + 1, s.rounds)}/${s.rounds}`, `Won: ${s.won}`, s.msg];
    if (s.phase === 'pick') return { hud, prompt: `Rent three Pokémon (${s.team.length}/3). Tap to choose or drop.`, cols: 3, cells: poolCells(s, (i) => `r${i}`), done: s.done };
    return {
      hud,
      prompt: 'Swap a rental for a fresh one, or go on. Team: ' + s.team.map((i) => s.pool[i]!.name).join(', '),
      cols: 2,
      cells: [...s.team.map((i, k) => ({ id: `s${k}`, label: `Swap ${s.pool[i]!.name}`, tone: 'dim' as const, disabled: s.done })), { id: 'go', label: 'Next round', tone: 'hot' as const, disabled: s.done }],
      done: s.done,
    };
  },
  act(c, s, id) {
    if (s.done) return;
    if (s.phase === 'pick' && id.startsWith('r')) {
      const i = Number(id.slice(1));
      s.team = s.team.includes(i) ? s.team.filter((x) => x !== i) : s.team.length < 3 ? [...s.team, i] : s.team;
      if (s.team.length === 3) {
        finishRound(s, duel(c, s, s.team.map((i2) => s.pool[i2]!), roundLevel(s)));
        s.phase = 'between';
      }
    } else if (s.phase === 'between' && id.startsWith('s')) {
      const k = Number(id.slice(1));
      const r = rng(s);
      const fresh = draw(c, r, 1, s.level)[0]!;
      keep(s, r);
      s.pool.push(fresh);
      s.team[k] = s.pool.length - 1;
      s.msg = `Rented ${label(fresh)}.`;
    } else if (s.phase === 'between' && id === 'go') {
      finishRound(s, duel(c, s, s.team.map((i) => s.pool[i]!), roundLevel(s)));
    }
  },
  result: (s) => ({ score: s.won, max: s.rounds }),
};

// ---------- Battle Palace (S441): the team plays on its own; you only set the lineup ----------
const STYLE_TEXT = { attack: 'attacks', support: 'defends', fickle: 'fickle', free: 'balanced' } as const;
const palace: MinigameModule<FrontState> = {
  start(c, p, rs) {
    const s = startFront(c, p, rs, 5);
    const r = rng(s);
    s.pool.forEach((f) => (f.nature = r.pick([...NATURE_IDS])));
    keep(s, r);
    return s;
  },
  view(_c, s) {
    const hud = [`Round ${Math.min(s.round + 1, s.rounds)}/${s.rounds}`, `Won: ${s.won}`, s.msg];
    if (s.phase === 'pick') {
      const cells = poolCells(s, (i) => `r${i}`).map((cell, i) => ({ ...cell, detail: `Lv${s.pool[i]!.level} ${natureName(s.pool[i]!.nature!)}: ${STYLE_TEXT[palaceStyle(s.pool[i]!.nature)]}` }));
      return { hud, prompt: `Pick your lineup in order (${s.team.length}/3). Nature decides how each one fights: attackers only strike, defenders use status moves, fickle ones alternate.`, cols: 3, cells, done: s.done };
    }
    return { hud, prompt: 'Your Pokémon fight their own way. Send them in.', cols: 1, cells: [{ id: 'go', label: 'Next round', tone: 'hot', disabled: s.done }], done: s.done };
  },
  act(c, s, id) {
    if (s.done) return;
    if (s.phase === 'pick' && id.startsWith('r')) {
      const i = Number(id.slice(1));
      if (!s.team.includes(i) && s.team.length < 3) s.team.push(i);
      else if (s.team.includes(i)) s.team = s.team.filter((x) => x !== i);
      if (s.team.length === 3) s.phase = 'between';
    } else if (s.phase === 'between' && id === 'go') finishRound(s, duel(c, s, s.team.map((i) => s.pool[i]!), roundLevel(s), true));
  },
  result: (s) => ({ score: s.won, max: s.rounds }),
};

// ---------- Battle Arcade (S443): spin for a random modifier, then fight ----------
const MODS = [
  { label: 'Tailwind: your team +4 levels', mine: 4, foe: 0 },
  { label: 'Boss rush: rival +4 levels', mine: 0, foe: 4 },
  { label: 'Even footing', mine: 0, foe: 0 },
  { label: 'Underdog: you -3, rival -6', mine: -3, foe: -6 },
  { label: 'Jackpot: you +6 levels', mine: 6, foe: 0 },
  { label: 'Hazard: you -4 levels', mine: -4, foe: 0 },
] as const;
interface ArcadeState extends FrontState {
  mod: number;
  spins: number;
  spinsMax: number;
}
const arcade: MinigameModule<ArcadeState> = {
  start(c, p, rs) {
    const s = { ...startFront(c, p, rs, 3), mod: 0, spins: p.spins!, spinsMax: p.spins! } as ArcadeState;
    s.team = [0, 1, 2];
    s.phase = 'between';
    const r = rng(s);
    s.mod = r.int(0, MODS.length - 1);
    keep(s, r);
    return s;
  },
  view(_c, s) {
    return {
      hud: [`Round ${Math.min(s.round + 1, s.rounds)}/${s.rounds}`, `Won: ${s.won}`, `Re-spins: ${s.spins}`, s.msg],
      prompt: `Your team: ${s.pool.map(label).join(', ')}.\nThe wheel says: ${MODS[s.mod]!.label}`,
      cols: 2,
      cells: [
        { id: 'spin', label: 'Spin again', tone: 'info', disabled: s.done || s.spins <= 0 },
        { id: 'go', label: 'Fight', tone: 'hot', disabled: s.done },
      ],
      done: s.done,
    };
  },
  act(c, s, id) {
    if (s.done) return;
    const r = rng(s);
    if (id === 'spin' && s.spins > 0) {
      s.spins -= 1;
      s.mod = r.int(0, MODS.length - 1);
    } else if (id === 'go') {
      const m = MODS[s.mod]!;
      keep(s, r);
      const mine = s.pool.map((f) => ({ ...f, level: Math.max(5, f.level + m.mine) }));
      finishRound(s, duel(c, s, mine, Math.max(5, roundLevel(s) + m.foe)));
      if (!s.done) {
        const r2 = rng(s);
        s.mod = r2.int(0, MODS.length - 1);
        keep(s, r2);
        s.spins = s.spinsMax;
      }
      return;
    }
    keep(s, r);
  },
  result: (s) => ({ score: s.won, max: s.rounds }),
};

// ---------- Battle Pyramid (S442): dark floors with limited vision ----------
interface PyramidState extends FrontState {
  n: number;
  floors: number;
  floor: number;
  steps: number;
  stepsMax: number;
  x: number;
  y: number;
  seen: boolean[];
  foes: boolean[];
  cleared: boolean[];
  foeWins: number;
  maxFoes: number;
}
function newFloor(s: PyramidState): void {
  const r = rng(s);
  const n = s.n;
  s.x = 0;
  s.y = 0;
  s.seen = Array<boolean>(n * n).fill(false);
  s.seen[0] = s.seen[1] = s.seen[n] = true;
  s.foes = Array<boolean>(n * n).fill(false);
  const spots = r.shuffle([...Array(n * n).keys()].filter((i) => i !== 0 && i !== n * n - 1));
  for (const i of spots.slice(0, s.maxFoes)) s.foes[i] = true;
  keep(s, r);
  s.steps = s.stepsMax;
}
const pyramid: MinigameModule<PyramidState> = {
  start(c, p, rs) {
    const f = startFront(c, p, rs, 3);
    const s = { ...f, n: 4, floors: p.floors!, floor: 0, steps: 0, stepsMax: p.steps!, x: 0, y: 0, seen: [], foes: [], cleared: [], foeWins: 0, maxFoes: p.foes! } as PyramidState;
    s.team = [0, 1, 2];
    newFloor(s);
    return s;
  },
  view(_c, s) {
    const cells: Cell[] = [];
    for (let i = 0; i < s.n * s.n; i++) {
      const here = i === s.y * s.n + s.x;
      const stairs = i === s.n * s.n - 1;
      cells.push({
        id: String(i),
        label: here ? '🧭' : !s.seen[i] ? '?' : stairs ? '🔼' : s.foes[i] ? '⚔' : '·',
        tone: here ? 'good' : !s.seen[i] ? 'dim' : s.foes[i] ? 'bad' : 'info',
        disabled: s.done,
      });
    }
    return { hud: [`Floor ${s.floor + 1}/${s.floors}`, `Steps: ${s.steps}`, `Trainers beaten: ${s.foeWins}`, s.msg], prompt: 'Feel your way through the dark. ⚔ is a hidden trainer (a win scores extra, a loss ends the climb). Reach 🔼.', cols: s.n, cells, done: s.done };
  },
  act(c, s, id) {
    if (s.done) return;
    const i = Number(id);
    const tx = i % s.n;
    const ty = Math.floor(i / s.n);
    if (Math.abs(tx - s.x) + Math.abs(ty - s.y) !== 1) return;
    s.x = tx;
    s.y = ty;
    s.steps -= 1;
    for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const nx = tx + dx;
      const ny = ty + dy;
      if (nx >= 0 && ny >= 0 && nx < s.n && ny < s.n) s.seen[ny * s.n + nx] = true;
    }
    if (s.foes[i]) {
      s.foes[i] = false;
      s.round = s.floor;
      if (duel(c, s, s.pool, roundLevel(s))) s.foeWins += 1;
      else return void (s.done = true);
    }
    if (tx === s.n - 1 && ty === s.n - 1) {
      s.floor += 1;
      if (s.floor >= s.floors) s.done = true;
      else newFloor(s);
    } else if (s.steps <= 0) s.done = true;
  },
  result: (s) => ({ score: Math.min(s.floor * 2 + s.foeWins, s.floors * (2 + s.maxFoes)), max: s.floors * (2 + s.maxFoes) }),
};

export const FRONTIER_GAMES: Record<string, MinigameModule<never>> = {
  'battle-factory': factory as never,
  'battle-palace': palace as never,
  'battle-arcade': arcade as never,
  'battle-pyramid': pyramid as never,
};
