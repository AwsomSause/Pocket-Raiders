// Pidgey's Resolve: a CPU-versus-CPU fight on the real battle engine, one Pokémon a side. Both sides are played by the AI from
// seeded streams of their own (`::sky::`), so reloading, re-opening a screen or the player's choices can never change a roll,
// and no gameplay stream is used. The finale uses a "pause" hook: at the first turn Pidgeot is under 35% HP it can stop (to ask the
// player who to cheer for) or apply the cheer; the fight is simply replayed from the start with the answer, which is the same
// fight up to that turn.

import type { Content } from '../contentSchema';
import { createBattle, exhibitionMove, resolveTurn, type BattleContext, type BattleEvent } from '../battle/engine';
import { createPokemon, maxHp } from '../pokemon';
import { Rng, hashSeed } from '../rng';
import type { PokemonInstance } from '../state';

export interface Duelist {
  speciesId: string;
  level: number;
  /** Replaces the species' moves (up to 4). */
  moves?: readonly string[];
  /** An ability it has outright. */
  ability?: string;
  /** Held items (catalog id → copies). */
  held?: Record<string, number>;
  /** Mega Evolves without a stone (Pidgeot's resolve); only set at the moment of the cheer. */
  skyMega?: boolean;
}

export type Pause = 'ask' | 'cheerPidgeot' | 'cheerFearow';

export interface DuelOptions {
  /** A side that may be cheered: the first time `a` is under this share of its HP the hook is asked what to do. */
  threshold?: number;
  /** What to do at that moment; `undefined` = stop and report `asked`. */
  atThreshold?: 'cheerA' | 'cheerB' | undefined | 'none';
  /** Label the two sides for the narration. */
  names: [string, string];
}

export interface DuelResult {
  winner: 0 | 1 | null;
  /** The fight stopped to ask the player who to cheer for. */
  asked: boolean;
  /** Pidgeot (side A) was cheered at the threshold, and how. */
  cheered?: 'a' | 'b';
  turns: number;
  /** A short, readable account (never one line per turn). */
  lines: string[];
  /** Share of side A's HP left at the end. */
  hpLeftA: number;
}

const build = (content: Content, d: Duelist, uid: string): PokemonInstance => {
  const mon = createPokemon(content, d.speciesId, d.level, uid);
  if (d.moves && d.moves.length > 0) mon.moves = d.moves.filter((id) => content.moves.has(id)).slice(0, 4).map((id) => ({ id, pp: content.moves.get(id)!.pp }));
  if (d.ability) mon.fixedAbility = d.ability;
  if (d.held) mon.held = { ...d.held };
  mon.hp = maxHp(content, mon);
  return mon;
};

/** Side A is the "player" side of the engine (so its Mega and stages work), side B the foe. */
export function cpuDuel(content: Content, seed: string, key: string, a: Duelist, b: Duelist, opts: DuelOptions): DuelResult {
  const mineMon = build(content, a, 'sky-a');
  const theirMon = build(content, b, 'sky-b');
  const startA = maxHp(content, mineMon);
  const battle = createBattle('trainer', [theirMon], 0, mineMon.uid, { classId: 'ace-trainer', name: opts.names[1], leaderId: null });
  const ctx: BattleContext = { content, battle, party: [mineMon], inventory: {}, rng: new Rng(hashSeed(`${seed}::sky::battle::${key}`)), captureRng: new Rng(hashSeed(`${seed}::sky::catch::${key}`)), catchMultiplier: 1 };
  const [nameA, nameB] = opts.names;
  const lines: string[] = [];
  const nameOf = (id: string): string => content.moves.get(id)?.name ?? id;
  let asked = false;
  let cheered: 'a' | 'b' | undefined;
  let turns = 0;
  let lastHalf = { a: false, b: false };
  let firstBlood = false;
  for (; turns < 120 && !battle.outcome; turns++) {
    // The moment: side A is under the threshold for the first time.
    if (opts.threshold !== undefined && !cheered && !asked && mineMon.hp > 0 && mineMon.hp / startA <= opts.threshold) {
      if (opts.atThreshold === undefined) {
        asked = true;
        if (mineMon.hp / startA < 0.5) lines.push(`${nameA} is down to the last of its strength.`);
        break;
      }
      if (opts.atThreshold === 'cheerA') {
        cheered = 'a';
        mineMon.skyMega = true;
      } else if (opts.atThreshold === 'cheerB') {
        cheered = 'b';
        battle.playerStages.atk = Math.min(6, battle.playerStages.atk + 2);
      }
      lines.push(opts.atThreshold === 'cheerA' ? `${nameA} will not go down.` : opts.atThreshold === 'cheerB' ? `${nameA} is furious.` : `The cliff is silent.`);
      if (opts.atThreshold === 'none') cheered = undefined;
      // Whatever the answer, the question is not asked twice.
      opts = { ...opts, threshold: undefined };
    }
    const index = exhibitionMove(ctx);
    let events: BattleEvent[];
    try {
      events = resolveTurn(ctx, { kind: 'move', index: Math.max(0, index) });
    } catch {
      break;
    }
    for (const e of events) {
      if (e.type === 'move' && !firstBlood) {
        firstBlood = true;
        lines.push(`${e.side === 'player' ? nameA : nameB} strikes first with ${nameOf(e.moveId)}.`);
      } else if (e.type === 'transform' && e.kind === 'mega' && e.side === 'player') lines.push(`${nameA} Mega Evolves from resolve alone.`);
      else if (e.type === 'damage') {
        const share = e.side === 'player' ? e.hpAfter / startA : e.hpAfter / maxHp(content, theirMon);
        if (share < 0.5 && !lastHalf[e.side === 'player' ? 'a' : 'b'] && e.hpAfter > 0) {
          lastHalf = { ...lastHalf, [e.side === 'player' ? 'a' : 'b']: true };
          lines.push(`${e.side === 'player' ? nameA : nameB} is down to half.`);
        }
      }
    }
  }
  const leftA = Math.max(0, mineMon.hp);
  const leftB = Math.max(0, theirMon.hp);
  const winner: 0 | 1 | null = asked ? null : battle.outcome ? (battle.outcome === 'win' ? 0 : 1) : leftA / startA >= leftB / maxHp(content, theirMon) ? 0 : 1;
  return { winner, asked, ...(cheered ? { cheered } : {}), turns, lines, hpLeftA: leftA / startA };
}
