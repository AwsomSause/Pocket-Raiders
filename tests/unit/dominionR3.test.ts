// DOMINION redesign R3 (pass 50, The Day): the pages read the run without changing it, keep the test ids the old views
// had, and draw the board, the clock and the calendar from live data. Report lines split into a title and a line.
import { describe, expect, it } from 'vitest';
import { assignModel } from '../../src/core/dominion/assignScreen';
import { morningModel } from '../../src/core/dominion/crewScreens';
import { districtModel } from '../../src/core/dominion/districtScreen';
import { mapModel, newCursor } from '../../src/core/dominion/fieldScreens';
import { ledgerModel } from '../../src/core/dominion/ledgerScreens';
import { paperModel } from '../../src/core/dominion/moments';
import { DOMINION_MODE_ID, startInRun } from '../../src/core/dominion/session';
import type { DominionBlock } from '../../src/core/dominion/schema';
import { STANDARD_CHOICE } from '../../src/core/rules';
import { chooseStarter, createRun } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { r5District, r5Map, spotOf, type R5MapExtras } from '../../src/ui/redux/screens/dominion/r50/day';
import { r5Assign, r5Ledger, r5Morning, r5Paper, split } from '../../src/ui/redux/screens/dominion/r50/day2';
import { PHASES, r5Calendar, r5Clock } from '../../src/ui/redux/screens/dominion/r50/day3';
import { r5RunOf } from '../../src/ui/redux/screens/dominion/r50/run';
import { content } from './helpers';

const start = (): { run: RunState; b: DominionBlock } => {
  const run0 = chooseStarter(content, createRun(content, { runId: 'r3', seed: 'r3', archetypeId: 'red', rules: { ...STANDARD_CHOICE, modeId: DOMINION_MODE_ID } }), 0);
  const out = startInRun(content, run0, { types: ['poison', 'dark'], member: 'grunt', look: 0 });
  expect(out.problem).toBeNull();
  return { run: out.run, b: out.run.expansion!.dominion! };
};
const extras = (): R5MapExtras => ({ spots: {}, face: '', hero: null, team: 'Team Nova', rivalInitial: 'R', region: 'Kanto', who: { name: 'Rotom', k: 'p-rotom' } });

describe('redesign R3: the map and the district file', () => {
  it('draws every district as a token with its old test id, without changing the block', () => {
    const { run, b } = start();
    const before = JSON.stringify(b);
    const c = newCursor(b);
    const html = r5Map(mapModel(b, run, c), extras(), { notice: null, garage: false, meet: null, alert: null, focus: false }, r5RunOf(b, [], {}));
    for (const d of mapModel(b, run, c).districts) expect(html).toContain(`data-testid="dom-dz-${d.id}"`);
    expect(html).toContain('data-testid="dom-file"');
    expect(html).toContain('data-testid="r5-map"');
    expect(JSON.stringify(b)).toBe(before);
  });
  it('Focus view folds the HUD and keeps the board', () => {
    const { run, b } = start();
    const c = newCursor(b);
    const html = r5Map(mapModel(b, run, c), extras(), { notice: null, garage: false, meet: null, alert: null, focus: true }, r5RunOf(b, [], {}));
    expect(html).toContain('data-testid="r5-focus"');
    expect(html).toContain('k-fv23');
    expect(html).toContain('dom-dz-');
  });
  it('places a district off the table by its map position (boundary)', () => {
    expect(spotOf('cerulean', 0, 0)).toEqual([389, 58]);
    expect(spotOf('nowhere', 38, 34)).toEqual([74, 58]);
  });
  it('the district file shows its actions and targets', () => {
    const { run, b } = start();
    const html = r5District(districtModel(b, run, newCursor(b)), '', null, r5RunOf(b, [], {}));
    expect(html).toContain('data-testid="dom-df-acts"');
    expect(html).toContain('data-testid="dom-df-street"');
  });
});

describe('redesign R3: the morning pages keep the old test ids', () => {
  it('Morning report, Assign a task, the paper and the Ledger', () => {
    const { run, b } = start();
    const before = JSON.stringify(b);
    const r = r5RunOf(b, [], {});
    const m = r5Morning(morningModel(b, 0, -1, false), { faces: [''], pic: '', colour: '#000', at: -1, talk: null, notice: null, today: ['a', 'b'] }, r);
    for (const id of ['dom-morning-report', 'dom-badge', 'dom-info-name', 'dom-strip-m1', 'dom-morning-assign', 'dom-next']) expect(m).toContain(`data-testid="${id}"`);
    const a = r5Assign(assignModel(b, 0, 0, false), '', {}, '#000', null, r);
    for (const id of ['dom-as-grid', 'dom-as-more', 'dom-as-give', 'dom-as-name']) expect(a).toContain(`data-testid="${id}"`);
    const p = r5Paper(paperModel(b, run.seed), '', [['Jobs', 'none']], r);
    for (const id of ['dom-paper', 'dom-paper-date', 'dom-paper-head', 'dom-paper-wanted', 'dom-paper-fold']) expect(p).toContain(`data-testid="${id}"`);
    const l = r5Ledger(ledgerModel(b, run, 0), { line: '', who: null, notice: null, barsIn: [0], barsOut: [0], labels: ['This week'], inSum: '₽0', outSum: '₽0', inNote: '', outNote: '', dirtyPct: 0 }, r);
    for (const id of ['dom-ledger', 'dom-ledger-money', 'dom-ledger-lines', 'dom-ledger-stamp', 'dom-ledger-back', 'dom-ledger-tab-2']) expect(l).toContain(`data-testid="${id}"`);
    expect(JSON.stringify(b)).toBe(before);
  });
  it('a talk card hides Start the day (the answer comes first)', () => {
    const { b } = start();
    const talk = { t: { name: 'Rook', text: 'Boss?', choices: ['Yes', 'No'] }, at: 1, pic: '', colour: '#000' } as unknown as Parameters<typeof r5Morning>[1]['talk'];
    const m = r5Morning(morningModel(b, 0, -1, false), { faces: [''], pic: '', colour: '#000', at: -1, talk, notice: null, today: [] }, r5RunOf(b, [], {}));
    expect(m).not.toContain('data-testid="dom-next"');
    expect(m).toContain('data-testid="dom-talk-1"');
  });
  it('splits a report line at its first short sentence, and keeps a long one whole', () => {
    expect(split('Rook guarded the HQ. Nobody came.')).toEqual(['Rook guarded the HQ', 'Nobody came.']);
    expect(split('A quiet night.')).toEqual(['A quiet night', null]);
    expect(split('A thief got in while nobody watched the front door at all. −₽50')).toEqual(['A thief got in while nobody watched the front door at all. −₽50', null]);
  });
});

describe('redesign R3: the clock and the calendar', () => {
  it('marks the phase that is now, one row per phase', () => {
    const { b } = start();
    const html = r5Clock({ day: 3, phase: 'night', used: 1, max: 3, left: '1 job left', rows: PHASES.map((p) => ({ phase: p, what: p, tag: p === 'night' ? 'Now' : null })), at: 3, cta: 'Sleep', who: null, line: '' }, r5RunOf(b, [], {}));
    expect(html).toContain('q15 q-night on');
    expect(html.match(/class="q15[^"]* on"/g)).toHaveLength(1);
    for (const p of PHASES) expect(html).toContain(`data-testid="dom-clock-${p}"`);
    expect(html).toContain('rotate(250deg)');
  });
  it('draws the days with their events; past days and today are marked', () => {
    const { b } = start();
    const days = Array.from({ length: 35 }, (_, i) => ({ d: i + 1, past: i + 1 < 9, now: i + 1 === 9, ev: (i + 1) % 7 === 0 ? { cls: 'e-pay', word: 'Payday' } : null }));
    const html = r5Calendar({ region: 'Kanto', month: 1, days, at: 8, title: 'Day 9', sub: 'Today', body: '', who: null, line: '' }, r5RunOf(b, [], {}));
    expect(html.match(/class="dc34/g)).toHaveLength(35);
    expect(html.match(/Payday/g)).toHaveLength(5);
    expect(html).toContain('dc34 now');
    expect(html.match(/dc34 past/g)).toHaveLength(8);
  });
});
