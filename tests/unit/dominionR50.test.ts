// DOMINION redesign R0 (pass 50): the chrome's live data, the HQ hub / Start menu / phone pages keep the test ids the
// old views had, the phone's cursor, and the page clock (entrances play once per page, not on every redraw).
import { describe, expect, it } from 'vitest';
import { bossMenuModel, BLADES, phoneMove } from '../../src/core/dominion/bossMenu';
import { cellsOf } from '../../src/core/dominion/hqScreens';
import { hqModel } from '../../src/core/dominion/screens';
import { DOMINION_MODE_ID, startInRun } from '../../src/core/dominion/session';
import type { DominionBlock } from '../../src/core/dominion/schema';
import { STANDARD_CHOICE } from '../../src/core/rules';
import { chooseStarter, createRun } from '../../src/core/run';
import { hubScr, r5BossMenu, r5Hq, r5Start, START_ITEMS, type R5HubExtras } from '../../src/ui/redux/screens/dominion/r50/hub';
import { r5RunOf } from '../../src/ui/redux/screens/dominion/r50/run';
import { content } from './helpers';

const block = (): DominionBlock => {
  const run = chooseStarter(content, createRun(content, { runId: 'r50', seed: 'r50', archetypeId: 'red', rules: { ...STANDARD_CHOICE, modeId: DOMINION_MODE_ID } }), 0);
  const out = startInRun(content, run, { types: ['poison', 'dark'], member: 'grunt', look: 0 });
  expect(out.problem).toBeNull();
  return out.run.expansion!.dominion!;
};

const extras = (b: DominionBlock, notice: string | null = null): R5HubExtras => {
  const { cells, rows } = cellsOf(b, null);
  return {
    rooms: cells, rows, level: b.hqLevel, levelName: 'The Warehouse', hqName: 'The Warehouse', next: { name: 'Hideout', cost: 3000, ready: null, building: false },
    member: { name: 'ROOK', pic: '<img data-testid="dom-hq-pic">', colour: '#3f7fd9', band: 'blank armband' }, boss: '', threat: null, desk: null, paper: null, notice, at: 0,
  };
};

describe('redesign R0: the chrome reads the run', () => {
  it('fills the top bar, tabs and keys from the block without changing it', () => {
    const b = block();
    const before = JSON.stringify(b);
    const r = r5RunOf(b, [], { open: [0, 1, 2, 3, 5] });
    expect(r.funds).toBe('₽1,000');
    expect(r.heat).toBe(b.heat);
    expect(r.phase).toBe('EVENING');
    expect(r.roster).toBe(`1/${b.rosterCap}`);
    expect(r.tod).toBe('eve');
    expect(r.war).toBeGreaterThanOrEqual(5);
    expect(r.war).toBeLessThanOrEqual(95);
    expect(r.cleanPct).toBeGreaterThanOrEqual(0);
    expect(JSON.stringify(b)).toBe(before);
  });
});

describe('redesign R0: pages keep the old test ids', () => {
  it('the HQ hub: orders, next, phase, funds, roster, team, member', () => {
    const b = block();
    const html = r5Hq(hqModel(b), extras(b), r5RunOf(b, [], { open: [0, 1, 2, 3, 5] }));
    for (const id of ['r5-hq', 'dom-orders', 'dom-next', 'dom-phase', 'dom-funds', 'dom-heat', 'dom-roster', 'dom-team', 'dom-says', 'dom-band', 'dom-hq-pic', 'dom-building', 'dom-hq-open', 'dom-rival-open', 'dom-voices-open', 'dom-tab-1', 'dom-tab-6', 'dom-emblem'])
      expect(html, id).toContain(`data-testid="${id}"`);
    expect(html).toContain('class="r50" id="r5"');
    // Operations is still shut: its tab is dimmed.
    expect(html).toMatch(/data-testid="dom-tab-5" style="opacity/);
  });
  it('a notice takes the text box (a tap closes it), and the member stays in it', () => {
    const b = block();
    const html = r5Hq(hqModel(b), extras(b, 'Not enough money.'), r5RunOf(b, []));
    expect(html).toContain('data-testid="dom-notice"');
    expect(html).toContain('data-act="dismiss"');
    expect(html).toContain('data-testid="dom-hq-pic"');
    expect(html).not.toContain('data-testid="dom-says"');
  });
  it('the Start menu draws the hub under its panel, with the cursor on one row', () => {
    const b = block();
    const run = r5RunOf(b, []);
    const html = r5Start(hubScr(hqModel(b), extras(b), run), START_ITEMS, 2, { name: 'Red', pic: '', funds: run.funds }, run);
    expect(html).toContain('data-testid="r5-start-panel"');
    expect(html.match(/class="si25 on/g)).toHaveLength(1);
    expect(html).toContain('data-testid="r5-start-reserve"');
    expect(html).toContain('class="rp21"');
  });
  it('the phone: ten blades (nine apps and the Back bar), the glance and the slot', () => {
    const b = block();
    const m = bossMenuModel(b, 0, { card: null, slot: 1 });
    const html = r5BossMenu(m, '', r5RunOf(b, []), '<span class="key q4">Q</span><span>Wheel</span>');
    expect(html.match(/data-testid="dom-blade-/g)).toHaveLength(BLADES.length);
    for (const id of ['dom-menu-title', 'dom-glance', 'dom-menu-slot', 'dom-menu-keys', 'dom-menu-quote', 'dom-blades'])
      expect(html, id).toContain(`data-testid="${id}"`);
    expect(html).toMatch(/class="bk50 on"[^>]*data-testid="dom-blade-back"/);
  });
});

describe('redesign R0: the phone cursor', () => {
  const n = BLADES.length; // Back + nine apps
  it('down from the Back bar goes to the first app; a three-wide grid after that', () => {
    expect(phoneMove(0, 'down', n)).toBe(1);
    expect(phoneMove(1, 'down', n)).toBe(4);
    expect(phoneMove(1, 'right', n)).toBe(2);
    expect(phoneMove(2, 'left', n)).toBe(1);
  });
  it('off the grid lands on the Back bar (boundary), and up from the bar goes to the bottom row', () => {
    expect(phoneMove(1, 'up', n)).toBe(0);
    expect(phoneMove(7, 'down', n)).toBe(0);
    expect(phoneMove(9, 'right', n)).toBe(0);
    expect(phoneMove(1, 'left', n)).toBe(0);
    expect(phoneMove(0, 'up', n)).toBe(7);
  });
});
