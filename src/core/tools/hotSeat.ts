// Hot-Seat Versus (idea S203): two people battle on one device. Each turn player 1 picks a move, the device is passed,
// player 2 picks, and the turn resolves with the normal battle engine (`ctx.enemyPick` stands in for the AI). The
// battle uses its own seeded stream, so the same teams, seed and picks always give the same fight. Pure.

import { createBattle, resolveTurn, type BattleContext, type BattleEvent } from '../battle/engine';
import type { Content } from '../contentSchema';
import { createPokemon } from '../pokemon';
import { hashSeed, Rng } from '../rng';
import type { PokemonInstance } from '../state';

export const HOTSEAT_MAX_TURNS = 200;

export interface HotSeat {
  ctx: BattleContext;
  names: [string, string];
  turns: number;
}

export type HotSeatWinner = 0 | 1 | 'draw' | null;

/** Teams are made from species ids at one level (1 to 100), up to 3 each. */
export function startHotSeat(content: Content, a: readonly string[], b: readonly string[], level: number, seed: string, names: [string, string]): HotSeat | { problem: string } {
  const ok = (ids: readonly string[]) => ids.length >= 1 && ids.length <= 3 && ids.every((id) => content.species.has(id));
  if (!ok(a) || !ok(b)) return { problem: 'Each player needs 1 to 3 known Pokémon.' };
  const lv = Math.min(100, Math.max(1, Math.trunc(level) || 1));
  const team = (ids: readonly string[], p: string): PokemonInstance[] => ids.map((id, i) => createPokemon(content, id, lv, `${p}${i}`));
  const party = team(a, 'a');
  const battle = createBattle('trainer', team(b, 'b'), 0, party[0]!.uid, { classId: 'hotseat', name: names[1], leaderId: null });
  battle.ai = 0;
  const ctx: BattleContext = { content, battle, party, inventory: {}, rng: new Rng(hashSeed(`${seed}#hotseat`)), captureRng: new Rng(hashSeed(`${seed}#hotseat-capture`)), catchMultiplier: 1 };
  const clean = (n: string, f: string) => n.trim().slice(0, 16) || f;
  return { ctx, names: [clean(names[0], 'Player 1'), clean(names[1], 'Player 2')], turns: 0 };
}

export const activeMon = (h: HotSeat, side: 0 | 1): PokemonInstance => (side === 0 ? h.ctx.party[h.ctx.battle.activeIndex]! : h.ctx.battle.enemyTeam[h.ctx.battle.enemyIndex]!);

export function hotSeatWinner(h: HotSeat): HotSeatWinner {
  const o = h.ctx.battle.outcome;
  if (o === 'win') return 0;
  if (o === 'lose') return 1;
  if (o) return 'draw';
  // Out of turns, or a Pokémon with no PP in any move: nothing more can happen, so it is a draw.
  const stuck = ([0, 1] as const).some((side) => activeMon(h, side).moves.every((m) => m.pp <= 0));
  return h.turns >= HOTSEAT_MAX_TURNS || stuck ? 'draw' : null;
}

/** The moves a player may pick now: index, name and PP left. */
export function moveOptions(h: HotSeat, side: 0 | 1): { index: number; name: string; pp: number }[] {
  return activeMon(h, side).moves.map((m, index) => ({ index, name: h.ctx.content.moves.get(m.id)?.name ?? m.id, pp: m.pp }));
}

/** Plays one turn with both picks. A fainted Pokémon of player 1 is replaced by the next healthy one. */
export function playTurn(h: HotSeat, pickA: number, pickB: number): { events: BattleEvent[] } | { problem: string } {
  if (hotSeatWinner(h) !== null) return { problem: 'The battle is over.' };
  const a = activeMon(h, 0);
  const b = activeMon(h, 1);
  if (!Number.isInteger(pickA) || pickA < 0 || pickA >= a.moves.length) return { problem: `${h.names[0]} picked a move that does not exist.` };
  if (!Number.isInteger(pickB) || pickB < 0 || pickB >= b.moves.length) return { problem: `${h.names[1]} picked a move that does not exist.` };
  if (a.moves[pickA]!.pp <= 0) return { problem: `${h.names[0]} has no PP left in that move.` };
  if (b.moves[pickB]!.pp <= 0) return { problem: `${h.names[1]} has no PP left in that move.` };
  const events: BattleEvent[] = [];
  h.ctx.enemyPick = pickB;
  events.push(...resolveTurn(h.ctx, { kind: 'move', index: pickA }));
  h.ctx.enemyPick = undefined;
  h.turns++;
  while (h.ctx.battle.needsSwitch && !h.ctx.battle.outcome) {
    const next = h.ctx.party.findIndex((p) => p.hp > 0);
    if (next < 0) break;
    events.push(...resolveTurn(h.ctx, { kind: 'switch', partyIndex: next }));
  }
  return { events };
}
