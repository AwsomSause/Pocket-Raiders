// DOMINION redesign R1 (pass 50): the Start and Guide pages keep the old test ids, the board's cursor walks two
// columns of eight, and the Founding's rows read the draft.
import { describe, expect, it } from 'vitest';
import { boardPins, boardStep } from '../../src/core/dominion/nav';
import type { TeamDraft } from '../../src/core/dominion/schema';
import { DOMINION_DATA } from '../../src/core/dominion/data';
import { r5Help, r5Lessons } from '../../src/ui/redux/screens/dominion/r50/guide';
import { r5PreRun } from '../../src/ui/redux/screens/dominion/r50/run';
import { foundingModel, r5Title } from '../../src/ui/redux/screens/dominion/r50/start';

const run = r5PreRun([]);

describe('redesign R1: the title', () => {
  const rows = [
    { id: 'new', label: 'New Dominion', sub: 'One Grunt', on: true, testid: 'dom-title-0' },
    { id: 'lessons', label: 'Tutorial', sub: '', on: true, testid: 'dom-title-tut' },
  ];
  it('keeps the old row ids, marks the cursor row and leaves Continue out without a run', () => {
    const h = r5Title({ at: 1, rows, cont: null, initial: 'N', goal: 0, crew: [] }, run);
    expect(h).toContain('data-testid="dom-title-0"');
    expect(h).toMatch(/class="wm50 on"[^>]*data-testid="dom-title-tut"/);
    expect(h).not.toContain('dom-title-1');
  });
  it('draws the Continue card with its line when there is a run', () => {
    const h = r5Title({ at: 0, rows: [{ id: 'continue', label: 'Continue', sub: '', on: true, testid: 'dom-title-1' }, ...rows], cont: { pic: '', line: 'Team Venom · Day 3 · ₽1,200', party: [], goal: 12 }, initial: 'V', goal: 12, crew: [] }, run);
    expect(h).toMatch(/class="cn50 on"[^>]*data-testid="dom-title-1"/);
    expect(h).toContain('Day 3');
  });
});

describe('redesign R1: the Guide pages', () => {
  it('How much help? draws three rows and the picked one is on', () => {
    const opts = [{ id: 'full', label: 'Full walkthrough', line: 'x' }, { id: 'tips', label: 'Tips only', line: 'y' }, { id: 'off', label: 'No help', line: 'z' }];
    const h = r5Help(opts, 2, run);
    expect(h).toMatch(/class="row on"[^>]*data-testid="dom-tut-help-off"/);
    expect(h).toContain('Straight to the setup');
  });
  it('the Lesson Book marks seen lessons and the setting, and links the X-ray only with a run', () => {
    const m = { lessons: [{ id: 'a', name: 'One', seen: true }, { id: 'b', name: 'Two', seen: false }], at: 1, mode: 'tips', modes: [['full', 'Full'], ['tips', 'Tips']] as const, xray: false };
    const h = r5Lessons(m, run);
    expect(h.match(/✓ seen/g)).toHaveLength(1);
    expect(h).toMatch(/class="on"[^>]*data-testid="dom-tut-mode-tips"/);
    expect(h).not.toContain('dom-guide-xray');
    expect(r5Lessons({ ...m, xray: true }, run)).toContain('dom-guide-xray');
  });
});

describe('redesign R1: How pages connect', () => {
  it('the back rooms leave out what the main routes list', () => {
    const main = new Set(boardPins(0).map((p) => p.id));
    expect(boardPins(0).length).toBeGreaterThan(0);
    expect(boardPins(1).some((p) => main.has(p.id))).toBe(false);
  });
  it('up and down wrap the list; left and right jump a column only when there is a row there', () => {
    expect(boardStep(14, 0, 'up')).toBe(13);
    expect(boardStep(14, 13, 'down')).toBe(0);
    expect(boardStep(14, 2, 'right')).toBe(10);
    expect(boardStep(14, 7, 'right')).toBe(7);
    expect(boardStep(14, 9, 'left')).toBe(1);
    expect(boardStep(0, 3, 'down')).toBe(0);
  });
});

describe('redesign R1: the Founding rows', () => {
  it('reads the draft and puts the cursor on the right row', () => {
    const st = DOMINION_DATA.founding.start;
    const d: TeamDraft = { name: 'Team Venom', primary: st.primary, secondary: st.secondary, initial: 'V', logo: st.logo, motto: 'From a single grunt.', goal: null };
    const m = foundingModel(d, 2, null, ['Team Venom'], null);
    expect(m.rows.map((r) => r.testid)).toEqual(['dom-f-name', 'dom-f-primary', 'dom-f-initial', 'dom-f-motto', 'dom-f-goal']);
    expect(m.at).toBe(1);
    expect(m.det).toContain('data-testid="dom-armband"');
    expect(foundingModel(d, 7, null, [], null).found).toBe(true);
    expect(foundingModel(d, 0, 'name', [], null).rows[0]!.value).toContain('r5car');
  });
});
