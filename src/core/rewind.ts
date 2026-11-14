// Beta 0.7 INSTRUMENTALITY L3: Rewinds (the Time Keeper's power, later also Dialga's Rite and Celebi's Wonder).
//
// Two kinds of snapshot live in the optional `run.expansion.rewind` block (no save bump: old runs have none):
//  - a run snapshot (`base`): the whole run as the current stage began (taken by startStage);
//  - battle snapshots (`turns`): the run as each turn of the current battle began, stored as small patches chained from
//    `base` (base + turns[0] = turn 1 start, + turns[1] = turn 2 start, ...), so a 30-turn battle costs kilobytes, not
//    30 copies of the run.
// Restoring gives back exactly the old state (byte-equal after canonical JSON), with two exceptions on purpose:
//  - the RNG streams are NOT rewound: the run keeps the streams it has now, so no random roll ever repeats and the turn
//    is played out afresh (Kice's Time Keeper text). A rewind itself rolls nothing, so it never advances a stream either.
//  - the rewind bookkeeping (uses, the snapshots still valid) and the save-safety copies (checkpoint, recorder).
// Off by default (`settings.expansion.rewinds`). In-run only: nothing is carried to another run.

import type { Content } from './contentSchema';
import { maxHp } from './pokemon';
import type { RunState } from './state';
import { RewindStateSchema, type PatchOp, type RewindState } from './rewindSchema';

export { RewindStateSchema, type PatchOp, type RewindState };

// ---------- patches ----------

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** JSON-style copy (undefined fields dropped), the form a save stores. */
export const jsonCopy = <T>(v: T): T => (v === undefined ? v : (JSON.parse(JSON.stringify(v)) as T));

function diffInto(a: unknown, b: unknown, path: (string | number)[], out: PatchOp[]): void {
  if (a === b) return;
  if (Array.isArray(a) && Array.isArray(b)) {
    for (let i = 0; i < b.length; i++) {
      if (i < a.length) diffInto(a[i], b[i], [...path, i], out);
      else out.push({ p: [...path, i], v: jsonCopy(b[i] ?? null) });
    }
    if (a.length !== b.length) out.push({ p: path, n: b.length });
    return;
  }
  if (isObj(a) && isObj(b)) {
    for (const k of Object.keys(b)) {
      if (b[k] === undefined) continue;
      if (a[k] === undefined) out.push({ p: [...path, k], v: jsonCopy(b[k]) });
      else diffInto(a[k], b[k], [...path, k], out);
    }
    for (const k of Object.keys(a)) if (a[k] !== undefined && b[k] === undefined) out.push({ p: [...path, k], d: 1 });
    return;
  }
  if (typeof a === 'number' && typeof b === 'number' && Number.isNaN(a) && Number.isNaN(b)) return;
  out.push({ p: path, v: jsonCopy(b ?? null) });
}

/** The changes that turn `a` into `b` (both JSON-like). */
export function diff(a: unknown, b: unknown): PatchOp[] {
  const out: PatchOp[] = [];
  diffInto(a, b, [], out);
  return out;
}

/** Applies `ops` to `target` in place and returns it (a root-level set returns the new value). */
export function applyPatch<T>(target: T, ops: readonly PatchOp[]): T {
  let root: unknown = target;
  for (const op of ops) {
    if (op.p.length === 0) {
      if (op.n !== undefined && Array.isArray(root)) root.length = op.n;
      else if (op.d !== 1) root = jsonCopy(op.v);
      continue;
    }
    let at = root as Record<string | number, unknown>;
    for (const k of op.p.slice(0, -1)) at = at[k] as Record<string | number, unknown>;
    const last = op.p[op.p.length - 1]!;
    if (op.n !== undefined) (at[last] as unknown[]).length = op.n;
    else if (op.d === 1) delete at[last];
    else at[last] = jsonCopy(op.v);
  }
  return root as T;
}

// ---------- snapshots ----------

/** The part of the run a snapshot keeps: everything but the rewind block, the checkpoint and the recorder (a JSON copy). */
export function rewindView(run: RunState): Record<string, unknown> {
  const { checkpoint: _c, recorder: _r, expansion, ...rest } = run;
  const view: Record<string, unknown> = { ...rest };
  if (expansion) {
    const { rewind: _w, ...ex } = expansion;
    view.expansion = ex;
  }
  return jsonCopy(view);
}

/** For the checkpoint and the VS Recorder copies: the run without the rewind snapshots (they'd double the save). */
export function withoutRewindSnapshots<T extends RunState | Omit<RunState, 'checkpoint' | 'recorder'>>(run: T): T {
  const w = run.expansion?.rewind;
  if (!w || (!w.base && w.turns.length === 0)) return run;
  return { ...run, expansion: { ...run.expansion, rewind: { ...w, base: undefined, turns: [] } } };
}

/** A restore path (checkpoint, VS Recorder, Safety Net) keeps the live rewind block, minus battle snapshots that no longer apply. */
export function carryRewind(from: RunState, to: RunState): void {
  const w = from.expansion?.rewind;
  if (!w) return;
  to.expansion = { ...to.expansion, rewind: { ...structuredClone(w), battleKey: null, turns: [] } };
}

export const rewindOf = (run: Pick<RunState, 'expansion'>): RewindState | null => run.expansion?.rewind ?? null;
const stageKeyOf = (run: RunState): string => `${run.regionIndex}:${run.stage?.index ?? -1}`;
/** The enemy party's uids: unique per run, so a new battle always has a new key. */
const battleKeyOf = (run: RunState): string | null => (run.battle ? `${run.battle.kind}:${run.battle.enemyTeam.map((m) => m.uid).join(',')}` : null);

/** Turns rewinds on for this run (the setting at run start, or a blessing later). Mutates `run`. */
export function grantRewinds(run: RunState, source: string): void {
  if (rewindOf(run)) return;
  run.expansion = { ...run.expansion, rewind: RewindStateSchema.parse({ source }) };
}

/** Run snapshot as a stage begins (called at the end of startStage). Mutates `run`. */
export function takeStageSnapshot(run: RunState): void {
  const w = rewindOf(run);
  if (!w) return;
  w.base = rewindView(run);
  w.stageKey = stageKeyOf(run);
  w.usedThisStage = 0;
  w.battleKey = null;
  w.turns = [];
}

// The newest turn state, kept between calls so a snapshot doesn't rebuild the chain every turn. Plain cache: if it
// misses (another run, a reload) the state is rebuilt from `base`, which gives the same result.
let cache: { key: string; state: unknown } | null = null;
const chainKey = (run: RunState, w: RewindState, n: number): string => `${run.runId}|${run.seed}|${w.stageKey}|${w.battleKey}|${n}|${JSON.stringify(w.turns[n - 1]?.patch ?? []).length}|${w.turns[n - 1]?.turn ?? ''}`;

/** The run as turn `turns[n - 1]` began (n = 0: the stage base). */
function stateAt(w: RewindState, n: number): Record<string, unknown> {
  let state = jsonCopy(w.base!) as Record<string, unknown>;
  for (let i = 0; i < n; i++) state = applyPatch(state, w.turns[i]!.patch);
  return state;
}

/** Battle snapshot as a turn begins (called at the top of takeTurn with the run as it was before the action). Mutates `run`. */
export function takeTurnSnapshot(before: RunState, run: RunState): void {
  const w = rewindOf(run);
  if (!w?.base || !run.battle) return;
  const key = battleKeyOf(before);
  if (w.battleKey !== key) {
    w.battleKey = key;
    w.turns = [];
  }
  const n = w.turns.length;
  const prev = cache && cache.key === chainKey(run, w, n) ? cache.state : stateAt(w, n);
  const now = rewindView(before);
  w.turns.push({ turn: before.battle!.turn, patch: diff(prev, now) });
  // The chain is kept whole for the battle (each patch is small; only the last `maxTurnsBack` can be reached) and is
  // cleared when the next battle begins.
  cache = { key: chainKey(run, w, w.turns.length), state: now };
}

/** How many turns back a battle rewind can go right now (0 = none). */
export function rewindTurnsAvailable(content: Content, run: RunState): number {
  const w = rewindOf(run);
  if (!w?.base || !run.battle || w.battleKey !== battleKeyOf(run) || w.turns.length === 0) return 0;
  if (w.stageKey !== stageKeyOf(run) || w.usedThisStage >= content.balance.rewind.usesPerStage) return 0;
  return Math.min(content.balance.rewind.maxTurnsBack, w.turns.length);
}

/** Builds the restored run around a snapshot state: live RNG streams, checkpoint, recorder and rewind block. */
function rebuild(live: RunState, state: Record<string, unknown>, rewind: RewindState, keepRecorder: boolean): RunState {
  const out = state as unknown as RunState;
  out.rng = structuredClone(live.rng);
  if (live.checkpoint) out.checkpoint = structuredClone(live.checkpoint);
  if (keepRecorder && live.recorder) out.recorder = structuredClone(live.recorder);
  out.expansion = { ...out.expansion, rewind };
  return out;
}

/**
 * The Time Keeper: goes back `turns` turns (1 = the start of the last turn played). HP, status, stat stages, field, move
 * uses and everything else return exactly; the RNG streams carry on, so the turns play out afresh. Returns null when the
 * rewind isn't available.
 */
export function rewindBattle(content: Content, live: RunState, turns: number): RunState | null {
  const most = rewindTurnsAvailable(content, live);
  if (turns < 1 || turns > most) return null;
  const w = rewindOf(live)!;
  const n = w.turns.length - turns + 1; // patches 0..n-1 give the start of turn index n-1
  const state = stateAt(w, n);
  const rewind: RewindState = { ...structuredClone(w), turns: structuredClone(w.turns.slice(0, n - 1)), usedThisStage: w.usedThisStage + 1, used: w.used + 1 };
  cache = null;
  return rebuild(live, state, rewind, true);
}

/** Can the whole stage be replayed from its start (Dialga's Rite, Celebi's Wonder)? */
export function stageRewindReady(run: RunState): boolean {
  const w = rewindOf(run);
  return Boolean(w?.base && w.stageKey === stageKeyOf(run));
}

/**
 * Dialga's Rite: back to the start of this stage. With `keepTeam`, Pokémon that were in the party then keep the levels,
 * stats, moves and species they have now (items and events of the stage are not kept). Returns null when unavailable.
 * The Rite's once-per-run rule belongs to the blessing that calls this.
 */
export function rewindStage(content: Content, live: RunState, opts: { keepTeam?: boolean } = {}): RunState | null {
  if (!stageRewindReady(live)) return null;
  const w = rewindOf(live)!;
  const state = jsonCopy(w.base!);
  const rewind: RewindState = { ...structuredClone(w), battleKey: null, turns: [], used: w.used + 1 };
  const out = rebuild(live, state, rewind, false);
  if (opts.keepTeam) {
    const now = new Map([...live.party, ...live.box].map((m) => [m.uid, m]));
    for (const mon of [...out.party, ...out.box]) {
      const future = now.get(mon.uid);
      if (!future) continue;
      Object.assign(mon, structuredClone({ speciesId: future.speciesId, level: future.level, xp: future.xp, moves: future.moves, vitamins: future.vitamins, ivs: future.ivs, evs: future.evs, hyperTrained: future.hyperTrained }));
      mon.hp = Math.min(mon.hp, maxHp(content, mon));
    }
  }
  cache = null;
  return out;
}
