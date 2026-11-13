// Stage maps: a layered graph of numbered levels (GAME_DESIGN.md §5).
//
// A stage has `columns` columns (20). Each column holds 1–3 nodes and every
// path moves forward exactly one column at a time, so every route from the
// start to the gym passes through exactly 20 numbered nodes. Two columns are
// trainer columns (every node there is a trainer), so every route meets
// exactly two trainers. The last column is the gym leader. Healing stops and
// shops sit beside nodes and don't count as levels.

import type { Campaign, Content } from './contentSchema';
import type { Rng } from './rng';
import type { MapNode, SideStop, StageMap, StageState } from './state';

const nodeId = (column: number, row: number) => `c${column}r${row}`;

/** Two edges cross when their order flips between the columns (a→b above c→d but b below d). */
function crosses(a: [number, number], b: [number, number]): boolean {
  return (a[0] < b[0] && a[1] > b[1]) || (a[0] > b[0] && a[1] < b[1]);
}

/** Beta 0.6 B6 options. Absent = the old two-trainer-column stage, with exactly the same rolls as before. */
export interface PacingOptions {
  /** 0-based region index: doubles trainers start at `balance.stage.pacing.doublesFromRegion`. */
  regionIndex: number;
}

export function generateStageMap(content: Content, campaign: Campaign, rng: Rng, pacing?: PacingOptions): StageMap {
  const cfg = { ...content.balance.stage, columns: campaign.columns, trainerColumns: campaign.trainerColumns };
  const C = cfg.columns;
  const pc = cfg.pacing;

  // 1. Pick the trainer columns, one from each configured range.
  const trainerColumns: number[] = [];
  let optionalColumns: number[] = [];
  // Stage pacing needs room for its windows; a short campaign (the dev campaign) has too few columns, so it keeps the old two-trainer-column stage.
  let usePacing = !!pacing;
  if (pacing) {
    // Stage pacing: 4–5 trainer columns, one from each window; 1–2 of them skippable (a wild node beside the trainer).
    const total = Math.min(rng.int(pc.totalMin, pc.totalMax), pc.windows.length);
    const picked: number[] = [];
    for (const [first, last] of pc.windows.slice(0, total)) {
      const lo = Math.min(first, C - 1);
      const hi = Math.min(last, C - 1);
      let col = rng.int(lo, hi);
      while (picked.includes(col) && col < hi) col += 1;
      if (!picked.includes(col)) picked.push(col);
    }
    if (picked.length < pc.totalMin) usePacing = false;
    else {
      const avoidable = Math.min(rng.int(pc.avoidableMin, pc.avoidableMax), Math.max(0, picked.length - 3));
      const pool = [...picked];
      while (optionalColumns.length < avoidable) optionalColumns.push(pool.splice(rng.int(0, pool.length - 1), 1)[0]!);
      optionalColumns.sort((a, b) => a - b);
      trainerColumns.push(...picked.filter((c) => !optionalColumns.includes(c)));
    }
  }
  if (!usePacing) {
    for (const [first, last] of cfg.trainerColumns) {
      let col = rng.int(first, last);
      while (trainerColumns.includes(col) && col < last) col += 1;
      if (!trainerColumns.includes(col)) trainerColumns.push(col);
    }
  }

  // 2. Column widths and nodes.
  const widths: number[] = [];
  const nodes: MapNode[] = [];
  for (let col = 1; col <= C; col++) {
    const isOptional = optionalColumns.includes(col);
    const width = col === C ? 1 : isOptional ? Math.max(2, rng.int(cfg.minWidth, cfg.maxWidth)) : rng.int(cfg.minWidth, cfg.maxWidth);
    widths[col] = width;
    const isTrainer = trainerColumns.includes(col);
    const columnNodes: MapNode[] = [];
    for (let row = 0; row < width; row++) {
      const kind = col === C ? 'gym' : isTrainer || (isOptional && row === 0) ? 'trainer' : 'wild';
      const harder = kind === 'wild' && width > 1 && rng.chance(cfg.harderChance);
      const note =
        kind === 'gym'
          ? `gym leader (last column)`
          : kind === 'trainer'
            ? isOptional
              ? `optional trainer, column ${col} (skip it by taking a wild node)`
              : `trainer column ${col} (one of ${trainerColumns.join(', ')})`
            : `wild, column ${col} of ${C}, width ${width}${harder ? `, harder (${Math.round(cfg.harderChance * 100)}% roll)` : ''}`;
      columnNodes.push({ id: nodeId(col, row), column: col, row, kind, harder, next: [], sides: [], note });
    }
    // Always leave at least one normal route through a column.
    if (columnNodes.length > 1 && columnNodes.every((n) => n.harder)) {
      columnNodes[0]!.harder = false;
      columnNodes[0]!.note += ' (made normal so the column has an easier route)';
    }
    nodes.push(...columnNodes);
  }

  // 3. Edges between neighbouring columns: an even, non-crossing spread so
  //    every node has a way forward and every node can be reached, plus a few
  //    extra non-crossing links for more forks.
  const byCol = (col: number) => nodes.filter((n) => n.column === col);
  for (let col = 1; col < C; col++) {
    const from = byCol(col);
    const to = byCol(col + 1);
    const n = from.length;
    const m = to.length;
    const edges: [number, number][] = [];
    for (let i = 0; i < n; i++) {
      const lo = Math.floor((i * m) / n);
      const hi = Math.ceil(((i + 1) * m) / n) - 1;
      for (let j = lo; j <= hi; j++) edges.push([i, j]);
    }
    for (let i = 0; i < n; i++) {
      if (!rng.chance(cfg.extraEdgeChance)) continue;
      const targets = edges.filter((e) => e[0] === i).map((e) => e[1]);
      const candidates = [Math.min(...targets) - 1, Math.max(...targets) + 1].filter((j) => j >= 0 && j < m);
      if (candidates.length === 0) continue;
      const j = rng.pick(candidates);
      if (!edges.some((e) => crosses(e, [i, j]))) edges.push([i, j]);
    }
    for (const [i, j] of edges) from[i]!.next.push(to[j]!.id);
    for (const node of from) node.next.sort();
  }

  // 4. Side stops (healing and shops).
  let sideCount = 0;
  const totalWeight = cfg.sideWeights.heal + cfg.sideWeights.shop;
  for (const node of nodes) {
    if (node.column === C) continue;
    let kind: SideStop['kind'] | null = null;
    if (cfg.healBeforeGym && node.column === C - 1) kind = 'heal';
    else if (totalWeight > 0 && rng.chance(cfg.sideChance)) {
      kind = rng.weighted([
        { item: 'heal' as const, weight: cfg.sideWeights.heal },
        { item: 'shop' as const, weight: cfg.sideWeights.shop },
      ]);
    }
    if (kind) node.sides.push({ id: `s${++sideCount}`, kind, used: false });
  }

  if (pacing && usePacing) {
    // One ace trainer (the last column every route must cross) and, from region 2, one doubles trainer. Their own streams.
    const forced = [...trainerColumns].sort((a, b) => a - b);
    const aceCol = forced[forced.length - 1];
    const acePick = nodes.filter((n) => n.column === aceCol);
    for (const n of acePick) { n.ace = true; n.note += ' (ace trainer)'; }
    if (pacing.regionIndex >= pc.doublesFromRegion) {
      const doublesCols = forced.filter((c) => c !== aceCol);
      const dCol = doublesCols.length > 0 ? doublesCols[doublesCols.length - 1]! : aceCol;
      for (const n of nodes.filter((x) => x.column === dCol)) { n.doubles = true; n.note += ' (doubles)'; }
    }
  }

  const trainerOut = [...trainerColumns].sort((a, b) => a - b);
  return { columns: C, nodes, trainerColumns: trainerOut, ...(pacing && usePacing ? { optionalTrainerColumns: optionalColumns } : {}) };
}

/**
 * The Pokémon League: one straight line of Elite Four members, then the champion.
 * There are no forks or side stops; the party is fully healed between battles.
 */
export function generateLeagueMap(eliteFourSize: number, opts: { shopAfter?: readonly number[] } = {}): StageMap {
  const columns = eliteFourSize + 1;
  const nodes: MapNode[] = [];
  for (let col = 1; col <= columns; col++) {
    const kind = col === columns ? 'champion' : 'elite';
    nodes.push({
      id: nodeId(col, 0),
      column: col,
      row: 0,
      kind,
      harder: false,
      next: col < columns ? [nodeId(col + 1, 0)] : [],
      // Galar's tournament: Ball Guy's shop opens after the listed rounds (a side stop; the party is healed every round anyway).
      sides: opts.shopAfter?.includes(col) && col < columns ? [{ id: 's1', kind: 'shop', used: false }] : [],
      note: kind === 'champion' ? 'champion (last)' : `Elite Four member ${col} of ${eliteFourSize}`,
    });
  }
  return { columns, nodes, trainerColumns: [] };
}

export function validateLeagueMap(map: StageMap): string[] {
  const problems: string[] = [];
  for (let col = 1; col <= map.columns; col++) {
    const nodes = map.nodes.filter((n) => n.column === col);
    const want = col === map.columns ? 'champion' : 'elite';
    if (nodes.length !== 1 || nodes[0]!.kind !== want) problems.push(`league column ${col} must be one ${want} node`);
    else if (col < map.columns && nodes[0]!.next.join() !== nodeId(col + 1, 0)) problems.push(`league node ${nodes[0]!.id} must lead to the next column`);
  }
  return problems;
}

/** Lists everything wrong with a map (empty when it's valid). */
export function validateStageMap(map: StageMap): string[] {
  const problems: string[] = [];
  const ids = new Set<string>();
  for (const n of map.nodes) {
    if (ids.has(n.id)) problems.push(`duplicate node id ${n.id}`);
    ids.add(n.id);
  }
  const byId = new Map(map.nodes.map((n) => [n.id, n]));
  for (let col = 1; col <= map.columns; col++) {
    const nodes = map.nodes.filter((n) => n.column === col);
    if (nodes.length === 0) problems.push(`column ${col} is empty`);
    const isTrainerCol = map.trainerColumns.includes(col);
    const isOptionalCol = (map.optionalTrainerColumns ?? []).includes(col);
    for (const n of nodes) {
      if (col === map.columns && n.kind !== 'gym') problems.push(`last column node ${n.id} is not the gym`);
      if (col !== map.columns && n.kind === 'gym') problems.push(`gym ${n.id} is not in the last column`);
      if (col !== map.columns && isOptionalCol) {
        if ((n.row === 0) !== (n.kind === 'trainer')) problems.push(`optional trainer column ${col}: node ${n.id} kind ${n.kind} is wrong`);
      } else if (col !== map.columns && isTrainerCol !== (n.kind === 'trainer')) problems.push(`node ${n.id} kind ${n.kind} doesn't match trainer columns`);
      if (col < map.columns && n.next.length === 0) problems.push(`node ${n.id} is a dead end`);
      for (const id of n.next) {
        const target = byId.get(id);
        if (!target) problems.push(`node ${n.id} leads to missing node ${id}`);
        else if (target.column !== col + 1) problems.push(`node ${n.id} skips or goes back to column ${target.column}`);
      }
      if (col > 1 && !map.nodes.some((p) => p.next.includes(n.id))) problems.push(`node ${n.id} can't be reached`);
    }
    if (col === map.columns && nodes.length !== 1) problems.push(`last column has ${nodes.length} nodes (needs exactly 1)`);
  }
  if (map.optionalTrainerColumns === undefined) {
    if (map.trainerColumns.length !== 2) problems.push(`expected 2 trainer columns, found ${map.trainerColumns.length}`);
  } else {
    const total = map.trainerColumns.length + map.optionalTrainerColumns.length;
    if (total < 4 || total > 5) problems.push(`expected 4–5 trainer columns, found ${total}`);
    if (map.optionalTrainerColumns.length > 2) problems.push(`expected at most 2 skippable trainer columns, found ${map.optionalTrainerColumns.length}`);
    for (const c of map.optionalTrainerColumns) if (map.nodes.filter((n) => n.column === c).length < 2) problems.push(`skippable trainer column ${c} has no wild node beside the trainer`);
  }
  // No crossing lines between neighbouring columns (keeps the map readable).
  for (let col = 1; col < map.columns; col++) {
    const from = map.nodes.filter((n) => n.column === col);
    const edges: [number, number][] = from.flatMap((n) => n.next.map((id) => [n.row, byId.get(id)?.row ?? 0] as [number, number]));
    for (let a = 0; a < edges.length; a++) for (let b = a + 1; b < edges.length; b++) if (crosses(edges[a]!, edges[b]!)) problems.push(`lines cross between columns ${col} and ${col + 1}`);
  }
  return [...new Set(problems)];
}

export function findNode(map: StageMap, id: string): MapNode {
  const node = map.nodes.find((n) => n.id === id);
  if (!node) throw new Error(`No map node "${id}"`);
  return node;
}

/** The nodes the player may move to next. */
export function nextChoices(stage: StageState): MapNode[] {
  if (stage.current === null) return stage.map.nodes.filter((n) => n.column === 1);
  const current = findNode(stage.map, stage.current);
  return current.next.map((id) => findNode(stage.map, id));
}

/** The column the player is on (0 before the first node). */
export function currentColumn(stage: StageState): number {
  return stage.current === null ? 0 : findNode(stage.map, stage.current).column;
}
