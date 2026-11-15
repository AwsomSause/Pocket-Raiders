// Catalog Overhaul placement: the pack's STAGE_MAP_AND_PLACEMENT.md rules (must-see, optional, side branch, rests, doors, budget, tags).
import { describe, expect, it } from 'vitest';
import { CO_BUDGET, fitsStage, nodesAhead, planCoStage, positioned, readPlacement, stageTags, stepColumn, type CoEntry } from '../../src/core/co/placement';
import { EventDefSchema } from '../../src/core/contentSchema';
import { addEventStops, chooseEvent, eligibleEvents } from '../../src/core/events';
import { nodeProtected } from '../../src/core/co/takeNode';
import { chooseStarter, createRun } from '../../src/core/run';
import type { MapNode, StageMap } from '../../src/core/state';
import { content } from './helpers';

/** A 20-column map: `widths[c - 1]` nodes in column c; every node leads to every node of the next column. */
function map(widths: number[], rests: number[] = []): StageMap {
  const nodes: MapNode[] = [];
  widths.forEach((w, i) => {
    for (let row = 0; row < w; row++) nodes.push({ id: `c${i + 1}r${row}`, column: i + 1, row, kind: i === widths.length - 1 ? 'gym' : 'wild', harder: false, next: [], sides: rests.includes(i + 1) && row === 0 ? [{ id: `heal-${i + 1}`, kind: 'heal', used: false }] : [], note: '' });
  });
  for (const n of nodes) n.next = nodes.filter((m) => m.column === n.column + 1).map((m) => m.id);
  return { columns: widths.length, nodes, trainerColumns: [] };
}
const WIDE = [2, 3, 3, 2, 3, 1, 3, 3, 2, 3, 3, 3, 1, 2, 3, 3, 2, 3, 2, 1];
const entry = (id: string, raw: Record<string, unknown>, door = false): CoEntry => ({ id, p: readPlacement(raw), door });
const col = (m: StageMap, nodeId: string) => m.nodes.find((n) => n.id === nodeId)!.column;

describe('reading a placement block', () => {
  it('takes the doc wording and fills the pack defaults', () => {
    const p = readPlacement({ shape: 'Single', earliest: 'A3', home: 7, window: [6, 9], sits: 'Optional', attaches: 'After the battle', tags: ['Water'], level: 'A−1', often: 'once per region' });
    expect(p).toMatchObject({ shape: 'single', earliest: 3, home: 7, window: [6, 9], sits: 'optional', attaches: 'after', tags: ['water'], level: -1, often: 'region' });
    expect(readPlacement({ home: 'Step 12' }).window).toEqual([10, 14]);
    expect(readPlacement({ shape: 'Door', home: 11 }).attaches).toBe('instead');
    expect(readPlacement({ often: 'once per save' }).often).toBe('run');
  });

  it('gives each shape its steps', () => {
    expect([1, 2, 3].map((beat) => readPlacement({ shape: 'Stage-Three', beat }).home)).toEqual([6, 12, 17]);
    expect([1, 2, 3].map((beat) => readPlacement({ shape: 'Stage-Three', beat }).sits)).toEqual(['optional', 'must-see', 'must-see']);
    expect([1, 2, 3].map((beat) => readPlacement({ shape: 'Region', beat })).map((p) => [p.stages[0], p.home, p.sits])).toEqual([[2, 8, 'must-see'], [5, 12, 'must-see'], [8, 17, 'must-see']]);
    expect([1, 2, 3].map((beat) => readPlacement({ shape: 'Trial', beat }).home)).toEqual([9, 12, 16]);
    expect(readPlacement({ shape: 'Visit' })).toMatchObject({ home: 11, sits: 'side-branch' });
  });

  it('knows which events it places and which are drawn like any other', () => {
    expect(positioned(readPlacement({ shape: 'Pool' }))).toBe(false);
    expect(positioned(readPlacement({ shape: 'Single', earliest: 'A2' }))).toBe(false);
    expect(positioned(readPlacement({ shape: 'Single', home: 5 }))).toBe(true);
    expect(positioned(readPlacement({ sits: 'must-see' }))).toBe(true);
  });
});

describe('stage tags and fit', () => {
  it('reads tags from the stage types and the time of day', () => {
    expect([...stageTags(['water', 'flying'], 'morning')].sort()).toEqual(['high', 'water']);
    expect(stageTags(['electric', 'flying'], 'night').has('storm')).toBe(true);
    expect(stageTags(['rock', 'steel'], 'night').has('night')).toBe(true);
    expect(stageTags(['ice'], 'morning')).toEqual(new Set(['water', 'high', 'snow']));
    expect(stageTags(['water'], 'morning', 'low').has('low tide')).toBe(true);
    const low = readPlacement({ tags: ['Water', 'Low tide'] });
    expect(fitsStage(low, 1, 1, stageTags(['water'], 'morning', 'low'))).toBe(true);
    expect(fitsStage(low, 1, 1, stageTags(['water'], 'morning', 'high'))).toBe(false);
    expect(fitsStage(readPlacement({ tags: ['tide'] }), 1, 1, stageTags(['water'], 'morning', 'high'))).toBe(true);
  });

  it('waits for the earliest stage, the in-region stage and the tags', () => {
    const p = readPlacement({ earliest: 'A3', stages: [2, 3], tags: ['water'] });
    expect(fitsStage(p, 2, 2, new Set(['water']))).toBe(false);
    expect(fitsStage(p, 10, 2, new Set(['water']))).toBe(true);
    expect(fitsStage(p, 10, 4, new Set(['water']))).toBe(false);
    expect(fitsStage(p, 10, 2, new Set(['cave']))).toBe(false);
  });

  it('maps the pack steps onto shorter maps and never onto the Gym', () => {
    expect(stepColumn(7, 20)).toBe(7);
    expect(stepColumn(20, 20)).toBe(19);
    expect(stepColumn(10, 12)).toBe(6);
    expect(stepColumn(19, 12)).toBe(11);
  });
});

describe('placing a stage', () => {
  it('puts a must-see event on the nearest chokepoint inside its window', () => {
    const m = map(WIDE);
    const [placed] = planCoStage(m, [entry('a', { home: 7, window: [5, 9], sits: 'must-see' })], 's');
    expect(placed!.nodeIds).toEqual(['c6r0']);
  });

  it('with no chokepoint in the window, puts it on every node of the home column', () => {
    const m = map(WIDE);
    const [placed] = planCoStage(m, [entry('a', { home: 10, window: [9, 12], sits: 'must-see' })], 's');
    expect(placed!.nodeIds.sort()).toEqual(['c10r0', 'c10r1', 'c10r2']);
  });

  it('puts an optional event on one node of its home column', () => {
    const m = map(WIDE);
    const [placed] = planCoStage(m, [entry('a', { home: 7, sits: 'optional' })], 's');
    expect(placed!.nodeIds).toHaveLength(1);
    expect(col(m, placed!.nodeIds[0]!)).toBe(7);
  });

  it('puts a side branch on the top or bottom row of a three-node column, never the middle', () => {
    const m = map(WIDE);
    for (const seed of ['a', 'b', 'c', 'd', 'e']) {
      const [placed] = planCoStage(m, [entry('x', { home: 9, window: [7, 12], sits: 'side branch' })], seed);
      const node = m.nodes.find((n) => n.id === placed!.nodeIds[0])!;
      expect(m.nodes.filter((n) => n.column === node.column)).toHaveLength(3);
      expect(node.row).not.toBe(1);
    }
  });

  it('puts a rest scene on the + node nearest its home step, or on an ordinary node when the window has none', () => {
    const m = map(WIDE, [8]);
    expect(planCoStage(m, [entry('a', { home: 10, window: [7, 12], attaches: 'at a + node' })], 's')[0]!.nodeIds).toEqual(['c8r0']);
    const none = planCoStage(map(WIDE), [entry('a', { home: 10, window: [9, 11], attaches: 'rest' })], 's')[0]!;
    expect(col(map(WIDE), none.nodeIds[0]!)).toBe(10);
  });

  it('never lets two must-see events share a column, and slides the loser to a later step first', () => {
    const m = map(WIDE);
    const placed = planCoStage(m, [entry('a', { home: 6, window: [5, 14], sits: 'must-see' }), entry('b', { home: 6, window: [5, 14], sits: 'must-see' })], 's');
    expect(placed.map((p) => col(m, p.nodeIds[0]!)).sort((x, y) => x - y)).toEqual([6, 13]);
  });

  it('keeps a Door alone on its node, and allows one Door a stage', () => {
    const m = map(WIDE);
    const placed = planCoStage(m, [entry('door-1', { shape: 'Door', home: 11 }, true), entry('door-2', { shape: 'Door', home: 12 }, true), entry('single', { home: 11 }), entry('single-2', { home: 11 }), entry('single-3', { home: 11 }), entry('single-4', { home: 11 })], 's');
    const doors = placed.filter((p) => p.id.startsWith('door'));
    expect(doors).toHaveLength(CO_BUDGET.doors);
    for (const p of placed.filter((x) => !x.id.startsWith('door'))) expect(p.nodeIds).not.toContain(doors[0]!.nodeIds[0]);
  });

  it('holds the budget: at most 8 placed events, 3 must-see, 3 badges on a node', () => {
    const m = map(WIDE);
    const many = Array.from({ length: 14 }, (_, i) => entry(`s${i}`, { home: 3 + i, sits: 'optional' }));
    expect(planCoStage(m, many, 's')).toHaveLength(CO_BUDGET.events);
    const musts = Array.from({ length: 5 }, (_, i) => entry(`m${i}`, { home: 3 + 3 * i, sits: 'must-see' }));
    expect(planCoStage(m, musts, 's')).toHaveLength(CO_BUDGET.mustSee);
    const crowd = planCoStage(map([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]), Array.from({ length: 6 }, (_, i) => entry(`c${i}`, { home: 4, window: [4, 4] })), 's');
    expect(crowd).toHaveLength(CO_BUDGET.badges);
  });

  it('allows two hard battles a stage (A+1, A+2), one A+2 at most, never on back-to-back steps', () => {
    const m = map(WIDE);
    const placed = planCoStage(m, [entry('h1', { home: 7, level: 'A+1' }), entry('h2', { home: 8, window: [8, 10], level: 'A+2' }), entry('h3', { home: 14, level: 'A+1' }), entry('h4', { home: 3, level: 'A+2' })], 's');
    const cols = placed.map((p) => col(m, p.nodeIds[0]!)).sort((x, y) => x - y);
    expect(placed).toHaveLength(CO_BUDGET.hard);
    expect(cols[1]! - cols[0]!).toBeGreaterThan(1);
    expect(placed.filter((p) => ['h2', 'h4'].includes(p.id)).length).toBeLessThanOrEqual(CO_BUDGET.hardest);
  });

  it('shows a "?" or no badge as a hidden stop', () => {
    const m = map(WIDE);
    expect(planCoStage(m, [entry('q', { home: 4, badge: '"?"' })], 's')[0]!.hidden).toBe(true);
    expect(planCoStage(m, [entry('q', { home: 4, badge: 'Its own badge' })], 's')[0]!.hidden).toBe(false);
  });

  it('never drops an owed beat: it takes the next free chokepoint after its window', () => {
    const m = map(WIDE);
    const full = Array.from({ length: 5 }, (_, i) => entry(`m${i}`, { home: 3 + 3 * i, sits: 'must-see' }));
    const beat = entry('beat', { shape: 'Region', beat: 2, stages: [1] });
    const placed = planCoStage(m, [...full, beat], 's');
    expect(placed.some((p) => p.id === 'beat')).toBe(true);
    expect(placed[0]!.id).toBe('beat');
  });

  it('is the same every time for the same seed', () => {
    const entries = [entry('a', { home: 4 }), entry('b', { home: 9, sits: 'side branch' }), entry('c', { home: 15, sits: 'must-see' })];
    expect(planCoStage(map(WIDE), entries, 'seed')).toEqual(planCoStage(map(WIDE), [...entries].reverse(), 'seed'));
  });

  it('only uses nodes still ahead of the player when asked to', () => {
    const m = map(WIDE);
    const ahead = nodesAhead(m, 'c8r0');
    expect(ahead.has('c8r0')).toBe(false);
    expect(ahead.has('c9r1')).toBe(true);
    const [placed] = planCoStage(m, [entry('late', { home: null, sits: 'must-see' })], 's', ahead);
    expect(col(m, placed!.nodeIds[0]!)).toBeGreaterThan(8);
  });
});

describe('placement in a run', () => {
  const ev = (id: string, extra: Record<string, unknown> = {}) => EventDefSchema.parse({ id, name: id, group: 'Test', intro: 'A scene.', choices: [{ label: 'Go on.', success: { text: 'Done.', effects: [{ kind: 'flag', key: `${id}-done` }] } }], ...extra });
  const start = () => chooseStarter(content, createRun(content, { runId: 'r', seed: 'co-place', archetypeId: 'red' }), 0);
  const stopsOf = (run: ReturnType<typeof start>, id: string) => run.stage!.map.nodes.filter((n) => n.sides.some((s) => s.eventId === id));

  it('puts a placed event on its step when the stage is built, and holds one back until its earliest stage', () => {
    content.events.set('co-test-home', ev('co-test-home'));
    content.events.set('co-test-late', ev('co-test-late'));
    content.coPlacement = new Map([['co-test-home', readPlacement({ home: 5, window: [5, 5] })], ['co-test-late', readPlacement({ home: 5, earliest: 'A9' })]]);
    const run = start();
    for (const n of run.stage!.map.nodes) n.sides = n.sides.filter((s) => s.kind !== 'event');
    addEventStops(content, run);
    const nodes = stopsOf(run, 'co-test-home');
    expect(nodes).toHaveLength(1);
    expect(nodes[0]!.column).toBe(stepColumn(5, run.stage!.map.columns));
    expect(stopsOf(run, 'co-test-late')).toHaveLength(0);
    expect(eligibleEvents(content, run).some((e) => e.id === 'co-test-late')).toBe(false);
    content.events.delete('co-test-home'); content.events.delete('co-test-late'); content.coPlacement = new Map();
  });

  it('places the next beat of a same-stage story ahead of the player the moment it is earned', () => {
    content.events.set('co-test-b1', ev('co-test-b1'));
    content.events.set('co-test-b2', ev('co-test-b2', { requires: [{ kind: 'flag', key: 'co-test-b1-done' }] }));
    content.coPlacement = new Map([['co-test-b1', readPlacement({ shape: 'Stage-Three', chain: 't', beat: 1 })], ['co-test-b2', readPlacement({ shape: 'Stage-Three', chain: 't', beat: 2 })]]);
    const run = start();
    const first = run.stage!.map.nodes.find((n) => n.column === 1)!;
    run.stage!.current = first.id;
    run.stage!.visited = [first.id];
    first.sides.push({ id: 'b1', kind: 'event', used: false, eventId: 'co-test-b1' });
    expect(stopsOf(run, 'co-test-b2')).toHaveLength(0);
    const after = chooseEvent(content, run, 'b1', 0).run;
    const nodes = stopsOf(after, 'co-test-b2');
    expect(nodes.length).toBeGreaterThan(0);
    for (const n of nodes) expect(n.column).toBeGreaterThan(1);
    // Must-see: every route from here passes one of its nodes.
    const columns = new Set(nodes.map((n) => n.column));
    expect(columns.size).toBe(1);
    expect(nodes.length === 1 || nodes.length === after.stage!.map.nodes.filter((n) => n.column === [...columns][0]).length).toBe(true);
    content.events.delete('co-test-b1'); content.events.delete('co-test-b2'); content.coPlacement = new Map();
  });

  it('a must-see stop or a Door is never spent by a "(a node)" cost; an optional stop can be', () => {
    for (const id of ['co-test-must', 'co-test-door', 'co-test-opt']) content.events.set(id, ev(id));
    content.coPlacement = new Map([['co-test-must', readPlacement({ home: 5, sits: 'Must-see' })], ['co-test-door', readPlacement({ shape: 'Door', home: 9 })], ['co-test-opt', readPlacement({ home: 7 })]]);
    const run = start();
    const plain = run.stage!.map.nodes.filter((n) => n.kind === 'wild' && n.sides.every((s) => s.kind !== 'event'));
    const [a, b, c] = plain;
    a!.sides.push({ id: 'm', kind: 'event', used: false, eventId: 'co-test-must' });
    b!.sides.push({ id: 'd', kind: 'event', used: false, eventId: 'co-test-door' });
    c!.sides.push({ id: 'o', kind: 'event', used: false, eventId: 'co-test-opt' });
    expect(nodeProtected(content, run, a!)).toBe(true);
    expect(nodeProtected(content, run, b!)).toBe(true);
    expect(nodeProtected(content, run, c!)).toBe(false);
    for (const id of ['co-test-must', 'co-test-door', 'co-test-opt']) content.events.delete(id);
    content.coPlacement = new Map();
  });

  it('a camp scene drawn from a Pool goes on a + node when the stage has one', () => {
    content.events.set('co-test-camp', ev('co-test-camp', { forced: true }));
    content.coPlacement = new Map([['co-test-camp', readPlacement({ shape: 'Pool', attaches: 'At a + node' })]]);
    expect(positioned(content.coPlacement.get('co-test-camp')!)).toBe(false);
    const run = start();
    for (const n of run.stage!.map.nodes) n.sides = n.sides.filter((s) => s.eventId !== 'co-test-camp');
    const rest = run.stage!.map.nodes.find((n) => n.column === 4)!;
    if (!rest.sides.some((s) => s.kind === 'heal')) rest.sides.push({ id: 'heal-test', kind: 'heal', used: false });
    addEventStops(content, run);
    const nodes = stopsOf(run, 'co-test-camp');
    expect(nodes.length).toBeGreaterThan(0);
    for (const n of nodes) expect(n.sides.some((s) => s.kind === 'heal')).toBe(true);
    content.events.delete('co-test-camp'); content.coPlacement = new Map();
  });
});
