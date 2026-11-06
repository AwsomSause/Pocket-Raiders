import { describe, expect, it } from 'vitest';
import { eventRows, filterRows, momentRows } from '../../src/debug/momentViewer';
import { chooseStarter, createRun, debugForceEvent } from '../../src/core/run';
import { isAssisted } from '../../src/core/tools/assisted';
import { eventView } from '../../src/core/events';
import { content } from './helpers';

describe('dev console', () => {
  it('lists library moments and battle triggers', () => {
    const rows = momentRows();
    expect(rows.some((r) => r.source === 'library')).toBe(true);
    expect(rows.some((r) => r.source === 'trigger')).toBe(true);
  });
  it('filters case-insensitively and keeps all on blank', () => {
    const rows = momentRows();
    expect(filterRows(rows, '  ').length).toBe(rows.length);
    expect(filterRows(rows, 'LAST-SECOND').length).toBeGreaterThan(0);
    expect(filterRows(rows, 'zzzz-no-match')).toEqual([]);
  });
  it('forces an event stop that opens, marks the run assisted, and refuses bad input', () => {
    const run = chooseStarter(content, createRun(content, { runId: 'dc', seed: 'dev-console', archetypeId: 'red' }), 0);
    const id = eventRows(content)[0]!.id;
    const { run: out, sideId } = debugForceEvent(content, run, id);
    expect(eventView(content, out, sideId).event.id).toBe(id);
    expect(isAssisted(out)).toBe(true);
    expect(run.stage!.map.nodes.flatMap((n) => n.sides).some((s) => s.id === sideId)).toBe(false);
    expect(() => debugForceEvent(content, run, 'no-such-event')).toThrow();
  });
});
