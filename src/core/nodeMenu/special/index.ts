// Node Event Menus P5: the special entries. Pure rules, no Phaser.
//   Fork: two cards for one choice; one half pays now, the other half can pay at a later node ("later").
//   Linked: a start card plants a follow-up card that shows up 1-3 columns later in the same stage.
//   Rival Takes It: an optional card you skip may be taken by one of your rivals, who fights you a level higher next time.
//   Escort: a companion walks with you for a few nodes; arriving with a fainted Pokémon shakes their nerve.
// Every roll uses its own hash of the run seed ('::node-menu::special::...'), never a shared stream, so turning node
// menus off leaves old seeds unchanged. Every payout is keyed in `done`, so nothing applies twice after a reload.

import type { Content, EventEffect } from '../../contentSchema';
import { applyEffect } from '../../events';
import { stageKey } from '../../mapItems';
import { Rng, hashSeed } from '../../rng';
import type { MapNode, RunState } from '../../state';
import { SPECIAL } from './data';
import { NodeMenuSpecialStateSchema, type NodeMenuSpecialState } from './schema';

export interface SpecialCtx {
  content: Content;
  run: RunState;
  node: MapNode;
}

/** A card the composer can show. Matches the menu entry shape (core/nodeMenu/schema.ts) with kind 'special'. */
export interface SpecialEntry {
  id: string;
  kind: 'special';
  category: 'fork' | 'linked' | 'escort';
  required: false;
  label: string;
  /** One line under the label. */
  text: string;
  done: false;
  locked: false;
}

/** A skipped card as the composer reports it when the player leaves the node. */
export interface SkippedEntry {
  id: string;
  kind: string;
  label: string;
  required: boolean;
}

const R = SPECIAL.rules;
const rngFor = (run: RunState, key: string) => new Rng(hashSeed(`${run.seed}::node-menu::special::${key}`));

/** The special-entry state, created on first use. */
export function specialState(run: RunState): NodeMenuSpecialState {
  run.expansion ??= {};
  const ex = run.expansion as { nodeMenuSpecial?: NodeMenuSpecialState };
  ex.nodeMenuSpecial ??= NodeMenuSpecialStateSchema.parse({});
  return ex.nodeMenuSpecial;
}
/** Read-only view (no state created). */
const peek = (run: RunState): NodeMenuSpecialState | undefined => (run.expansion as { nodeMenuSpecial?: NodeMenuSpecialState } | undefined)?.nodeMenuSpecial;

const stageOf = (run: RunState): string => stageKey(run) ?? 'none';

function applyAll(ctx: SpecialCtx, effects: readonly EventEffect[], key: string): string[] {
  const rng = rngFor(ctx.run, `fx::${key}`);
  return effects.map((e) => applyEffect(ctx.content, ctx.run, e, rng)).filter((t) => t !== '');
}

const forkDef = (id: string) => SPECIAL.forks.find((f) => f.id === id);
const linkDef = (id: string) => SPECIAL.links.find((l) => l.id === id);
const escortDef = (id: string) => SPECIAL.escorts.find((e) => e.id === id);

const entry = (id: string, category: SpecialEntry['category'], label: string, text: string): SpecialEntry => ({ id, kind: 'special', category, required: false, label, text, done: false, locked: false });

/**
 * Called when the player arrives at a node (safe to call again for the same node): pays fork halves that are due,
 * moves the escort one step, and drops follow-ups whose window has passed. Returns lines to show.
 */
export function arriveAtNode(ctx: SpecialCtx): string[] {
  const st = peek(ctx.run);
  if (!st) return [];
  const stage = stageOf(ctx.run);
  const key = `arrive:${stage}:${ctx.node.id}`;
  if (st.done.includes(key)) return [];
  st.done.push(key);
  const lines: string[] = [];
  // Fork halves due here (or left over from an earlier stage: they pay on the first node reached).
  const due = st.pending.filter((p) => p.stage !== stage || ctx.node.column >= p.atColumn);
  st.pending = st.pending.filter((p) => !due.includes(p));
  for (const p of due) {
    const branch = forkDef(p.forkId)?.[p.branch];
    if (!branch) continue;
    const got = applyAll(ctx, branch.later, `later:${p.forkId}:${p.stage}:${ctx.node.id}`);
    lines.push(`${branch.label}: it pays off.${got.length ? ` ${got.join(', ')}` : ''}`);
  }
  // Follow-ups whose window passed.
  const gone = st.links.filter((l) => l.stage !== stage || ctx.node.column > l.until);
  st.links = st.links.filter((l) => !gone.includes(l));
  for (const l of gone) {
    const def = linkDef(l.linkId);
    if (def) lines.push(`You never found "${def.end.label}". The chance has passed.`);
  }
  // The escort.
  const esc = st.escort;
  if (esc && esc.lastNode !== ctx.node.id) {
    const def = escortDef(esc.escortId);
    esc.lastNode = ctx.node.id;
    if (!def) st.escort = null;
    else if (esc.stage !== stage) {
      // The stage ended on the way: they reached the town with you.
      lines.push(...finishEscort(ctx, st, def, esc.nerve > 0));
    } else {
      if (ctx.run.party.some((m) => m.hp <= 0)) esc.nerve = Math.max(0, esc.nerve - 1);
      esc.nodesLeft = Math.max(0, esc.nodesLeft - 1);
      if (esc.nerve === 0) lines.push(...finishEscort(ctx, st, def, false));
      else if (esc.nodesLeft === 0) lines.push(...finishEscort(ctx, st, def, true));
    }
  }
  return lines;
}

function finishEscort(ctx: SpecialCtx, st: NodeMenuSpecialState, def: (typeof SPECIAL.escorts)[number], ok: boolean): string[] {
  st.escort = null;
  if (!ok) return [def.fail];
  const got = applyAll(ctx, def.reward, `escort:${def.id}:${ctx.node.id}`);
  return [`${def.done}${got.length ? ` ${got.join(', ')}` : ''}`];
}

/** Columns left after this node in the current stage. */
const columnsLeft = (ctx: SpecialCtx): number => Math.max(0, (ctx.run.stage?.map.columns ?? ctx.node.column) - ctx.node.column);

/**
 * The special cards for this node: due follow-ups always, plus at most `maxSpecialPerMenu` new ones from one roll.
 * Pure for a given state: the same node gives the same cards on every call.
 */
export function specialEntriesFor(ctx: SpecialCtx): SpecialEntry[] {
  const { run, node } = ctx;
  if (!run.stage || run.stage.kind === 'league' || node.kind !== 'wild' && node.kind !== 'trainer') return [];
  const st = peek(run);
  const stage = stageOf(run);
  const out: SpecialEntry[] = [];
  for (const l of st?.links ?? []) {
    const def = linkDef(l.linkId);
    if (def && l.stage === stage && node.column >= l.from && node.column <= l.until) out.push(entry(`sp:link:${l.linkId}:end`, 'linked', def.end.label, def.end.text));
  }
  if (R.maxSpecialPerMenu <= 0) return out;
  const done = new Set(st?.done ?? []);
  const left = columnsLeft(ctx);
  const rng = rngFor(run, `menu::${stage}:${node.id}`);
  const roll = rng.float();
  const forks = SPECIAL.forks.filter((f) => !done.has(`fork:${f.id}@${stage}`));
  const links = SPECIAL.links.filter((l) => !done.has(`link:${l.id}@${stage}`) && !(st?.links ?? []).some((x) => x.linkId === l.id));
  const escorts = SPECIAL.escorts.filter((e) => !done.has(`escort:${e.id}@${stage}`) && e.nodes < left);
  if (roll < R.forkChance) {
    if (forks.length) {
      const f = rng.pick(forks);
      out.push(entry(`sp:fork:${f.id}:a`, 'fork', `${f.label}: ${f.a.label}`, f.a.text), entry(`sp:fork:${f.id}:b`, 'fork', `${f.label}: ${f.b.label}`, f.b.text));
    }
  } else if (roll < R.forkChance + R.linkChance) {
    if (links.length && left >= R.linkWindow[0]) {
      const l = rng.pick(links);
      out.push(entry(`sp:link:${l.id}:start`, 'linked', l.start.label, l.start.text));
    }
  } else if (roll < R.forkChance + R.linkChance + R.escortChance) {
    if (escorts.length && !st?.escort) {
      const e = rng.pick(escorts);
      out.push(entry(`sp:escort:${e.id}`, 'escort', e.label, e.text));
    }
  }
  return out;
}

/** True for an id this module owns. */
export const isSpecialEntry = (id: string): boolean => id.startsWith('sp:');

/**
 * The player picked a special card. Applies it once and returns the lines to show; picking the other half of a fork
 * already chosen, or a card that is no longer valid, does nothing and returns [].
 */
export function pickSpecial(ctx: SpecialCtx, id: string): string[] {
  const [, kind, defId, part] = id.split(':');
  const stage = stageOf(ctx.run);
  const st = specialState(ctx.run);
  if (kind === 'fork') {
    const f = defId ? forkDef(defId) : undefined;
    const key = `fork:${defId}@${stage}`;
    if (!f || (part !== 'a' && part !== 'b') || st.done.includes(key)) return [];
    st.done.push(key);
    const branch = f[part];
    const got = applyAll(ctx, branch.now, `now:${defId}:${stage}:${ctx.node.id}`);
    if (branch.later.length) st.pending.push({ forkId: f.id, branch: part, stage, atColumn: ctx.node.column + 1 });
    return [`${branch.text}${got.length ? ` ${got.join(', ')}` : ''}`];
  }
  if (kind === 'link') {
    const l = defId ? linkDef(defId) : undefined;
    if (!l) return [];
    if (part === 'start') {
      const key = `link:${l.id}@${stage}`;
      if (st.done.includes(key)) return [];
      st.done.push(key);
      const [lo, hi] = R.linkWindow;
      const until = Math.min(ctx.node.column + hi, ctx.run.stage?.map.columns ?? ctx.node.column + hi);
      st.links.push({ linkId: l.id, stage, from: Math.min(ctx.node.column + lo, until), until });
      const got = applyAll(ctx, l.start.effects, `link-start:${l.id}:${stage}`);
      return [`${l.start.text}${got.length ? ` ${got.join(', ')}` : ''}`];
    }
    if (part === 'end') {
      const open = st.links.find((x) => x.linkId === l.id && x.stage === stage && ctx.node.column >= x.from && ctx.node.column <= x.until);
      if (!open) return [];
      st.links = st.links.filter((x) => x !== open);
      st.done.push(`link-end:${l.id}@${stage}`);
      const got = applyAll(ctx, l.end.effects, `link-end:${l.id}:${stage}`);
      return [`${l.end.text}${got.length ? ` ${got.join(', ')}` : ''}`];
    }
    return [];
  }
  if (kind === 'escort') {
    const e = defId ? escortDef(defId) : undefined;
    const key = `escort:${defId}@${stage}`;
    if (!e || st.escort || st.done.includes(key)) return [];
    st.done.push(key);
    st.escort = { escortId: e.id, stage, nodesLeft: e.nodes, nerve: R.escortNerve, lastNode: ctx.node.id };
    return [`${e.text} (${e.nodes} stops)`];
  }
  return [];
}

/**
 * Rival Takes It: the player left the node without some optional cards. One roll per node; when it hits, one of your
 * rivals takes one skipped card and fights you a little stronger next time (rivalSpoilLevels). Returns lines to show.
 */
export function onSkipped(ctx: SpecialCtx, skipped: readonly SkippedEntry[]): string[] {
  const { run } = ctx;
  const cfg = R.rivalTakes;
  const takeable = skipped.filter((s) => !s.required && s.kind !== 'micro' && !s.id.endsWith(':end'));
  if (!takeable.length || cfg.chance <= 0) return [];
  const stage = stageOf(run);
  const key = `rival:${stage}:${ctx.node.id}`;
  const st0 = peek(run);
  if (st0?.done.includes(key)) return [];
  if ((st0?.spoils ?? []).filter((s) => s.stage === stage).length >= cfg.maxPerStage) return [];
  const rivals = run.story.rivals.filter((r) => cfg.rivalStates.includes(r.state)).sort((a, b) => a.id.localeCompare(b.id));
  if (!rivals.length) return [];
  const rng = rngFor(run, `rival::${stage}:${ctx.node.id}`);
  if (!rng.chance(cfg.chance)) return [];
  const rival = rng.pick(rivals);
  const taken = rng.pick(takeable);
  const st = specialState(run);
  st.done.push(key);
  st.spoils.push({ rivalId: rival.id, entry: taken.label, stage, spent: false });
  if (st.spoils.length > 60) st.spoils.splice(0, st.spoils.length - 60);
  const line = rng.pick(SPECIAL.rivalLines).replaceAll('{rival}', rival.name).replaceAll('{entry}', taken.label);
  return [line];
}

/** Extra levels for this rival's next fight from what it took (capped). 0 when it took nothing. */
export function rivalSpoilLevels(run: RunState, rivalId: string): number {
  const n = (peek(run)?.spoils ?? []).filter((s) => s.rivalId === rivalId && !s.spent).length;
  return Math.min(R.rivalTakes.maxLevels, n * R.rivalTakes.levelsPerSpoil);
}

/** After a fight with this rival: what it took has been used. */
export function spendRivalSpoils(run: RunState, rivalId: string): void {
  for (const s of peek(run)?.spoils ?? []) if (s.rivalId === rivalId) s.spent = true;
}
