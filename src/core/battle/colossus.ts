// Beta 0.6 Colossus rules (plan E4): an Apex Shadow with armor seals, each with its own shield bar. Pure rules, no Phaser, no
// dice. While a seal remains the foe cannot be knocked out: damage drains the first unbroken seal's shield bar and never
// reaches its HP. A broken seal removes one of the foe's moves (the named one if it knows it, else its strongest). A timer
// counts down each turn; when it runs out the Apex escapes (the battle ends as a lost fight with `escaped` set, which the
// Colossus format reads as "taken" and the climax still counts). Presentation (the Blueprint plate) only reads this state.

import type { Content } from '../contentSchema';
import type { BattleState, ColossusBattle, PokemonInstance } from '../state';
import { maxHp } from '../pokemon';

export interface ColossusSealConfig {
  name: string;
  /** The move its loss removes (a move id); the foe's strongest move when it does not know it. Empty = nothing removed (the last seal). */
  removes: string;
  /** What the plate calls the loss ("Mind Vault", "Obedience"). */
  removesLabel: string;
  /** Share of the seal's shield bar already gone at the start (a cracked seal), 0 to 90. */
  crackedPct?: number;
}

export interface ColossusConfig {
  id: string;
  seals: ColossusSealConfig[];
  /** Each seal's shield bar, as a percent of the foe's max HP. */
  shieldPct: number;
  /** Turns until the Apex escapes. */
  timer: number;
}

/** Sets the Colossus up on a battle that has just been created (the foe is `enemyTeam[0]`). */
export function startColossus(content: Content, battle: BattleState, cfg: ColossusConfig): void {
  const foe = battle.enemyTeam[0];
  const bar = foe ? Math.max(1, Math.floor((maxHp(content, foe) * cfg.shieldPct) / 100)) : 1;
  battle.colossus = {
    id: cfg.id,
    seals: cfg.seals.map((s) => ({
      name: s.name,
      removes: s.removes,
      removesLabel: s.removesLabel,
      max: bar,
      shield: Math.max(1, Math.floor(bar * (1 - Math.min(90, s.crackedPct ?? 0) / 100))),
      broken: false,
    })),
    timerLeft: cfg.timer,
    timerMax: cfg.timer,
    escaped: false,
    notes: [],
    pendingBreaks: [],
  };
}

export const sealsLeft = (c: Pick<ColossusBattle, 'seals'>): number => c.seals.filter((s) => !s.broken).length;

/** Damage to the Colossus: drains the first unbroken seal's bar. Returns what reaches its HP (0 while any seal remains). */
export function colossusAbsorb(battle: Pick<BattleState, 'colossus'>, amount: number): number {
  const c = battle.colossus;
  if (!c || amount <= 0) return amount;
  const i = c.seals.findIndex((s) => !s.broken);
  if (i < 0) return amount;
  const seal = c.seals[i]!;
  seal.shield = Math.max(0, seal.shield - amount);
  if (seal.shield === 0) {
    seal.broken = true;
    c.pendingBreaks.push(i);
    c.notes.push(`The ${seal.name} seal shatters!`);
    if (sealsLeft(c) === 0) c.notes.push('The armor falls away.');
  }
  return 0;
}

/** Removes the move a broken seal names (or the strongest one), always leaving the foe at least one move. */
function removeMove(content: Content, foe: PokemonInstance, seal: ColossusBattle['seals'][number]): string | null {
  if (!seal.removes || foe.moves.length <= 1) return null;
  let at = foe.moves.findIndex((m) => m.id === seal.removes);
  if (at < 0) {
    let best = -1;
    foe.moves.forEach((m, i) => {
      const p = content.moves.get(m.id)?.power ?? 0;
      if (p > best) { best = p; at = i; }
    });
  }
  const [gone] = foe.moves.splice(at, 1);
  return gone?.id ?? null;
}

export interface ColossusTurnResult {
  notes: string[];
  timeout: boolean;
}

/** The end of a turn: broken seals take their moves, the timer ticks, and at zero the Apex escapes. */
export function colossusEndOfTurn(content: Content, battle: Pick<BattleState, 'colossus' | 'enemyTeam'>): ColossusTurnResult {
  const c = battle.colossus;
  const out: ColossusTurnResult = { notes: [], timeout: false };
  if (!c) return out;
  const foe = battle.enemyTeam[0];
  for (const i of c.pendingBreaks.splice(0)) {
    const seal = c.seals[i]!;
    if (foe && removeMove(content, foe, seal)) out.notes.push(`Loss of the ${seal.name} seal removes ${seal.removesLabel}.`);
    else if (seal.removesLabel && !seal.removes) out.notes.push(`Loss of the ${seal.name} seal removes ${seal.removesLabel}.`);
  }
  out.notes.unshift(...c.notes.splice(0));
  if (sealsLeft(c) > 0) {
    c.timerLeft = Math.max(0, c.timerLeft - 1);
    if (c.timerLeft === 0) {
      c.escaped = true;
      out.timeout = true;
      out.notes.push('Time is up! The helicopter lifts the Apex away.');
    } else if (c.timerLeft <= 3) {
      out.notes.push(`${c.timerLeft} turn${c.timerLeft === 1 ? '' : 's'} left.`);
    }
  }
  return out;
}
