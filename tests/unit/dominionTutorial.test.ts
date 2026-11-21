// DOMINION tutorial and opening (plans/evil-mode-rework/tutorial-mockups): the help level kept on the run, which lesson or
// page is due where, the Day 2 Rattata given once, a save round trip, the Settings default and an old block (no `tut`)
// playing exactly as before.
import { describe, expect, it } from 'vitest';
import { DOMINION_MODE_ID, dominionBlock, startInRun, stepInRun } from '../../src/core/dominion/session';
import { DominionBlockSchema, DominionPrefsSchema, type DominionBlock, type DominionSetup } from '../../src/core/dominion/schema';
import { lessonDue, pageDue, TUT, tutMode, weekOne } from '../../src/core/dominion/tutorial';
import { DOMINION_DATA } from '../../src/core/dominion/data';
import { STANDARD_CHOICE } from '../../src/core/rules';
import { chooseStarter, createRun } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { content } from './helpers';
import { helpView, lessonOverlay, lessonSteps, replayView, setupTip } from '../../src/ui/redux/screens/dominion/tutorial';

const domRun = (seed = 'tut'): RunState => chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red', rules: { ...STANDARD_CHOICE, modeId: DOMINION_MODE_ID } }), 0);
const begin = (tutorial?: DominionSetup['tutorial']): RunState => {
  const out = startInRun(content, domRun(), { types: ['poison', 'dark'], member: 'grunt', look: 0, ...(tutorial ? { tutorial } : {}) });
  expect(out.problem).toBeNull();
  return out.run;
};
const blk = (r: RunState): DominionBlock => dominionBlock(r)!;
const step = (r: RunState, a: Parameters<typeof stepInRun>[2]): RunState => {
  const out = stepInRun(content, r, a);
  expect(out.ok).toBe(true);
  return out.run;
};
const opened = (tutorial: DominionSetup['tutorial'] = 'full'): RunState => step(begin(tutorial), { t: 'open' });
const seenAll = (r: RunState, ...ids: string[]): RunState => ids.reduce((x, id) => step(x, { t: 'tut', op: 'seen', arg: id }), r);

describe('Tutorial data', () => {
  it('has the fifteen lessons of the mockups and three help levels', () => {
    expect(TUT.lessons.map((l) => l.name)).toEqual(['The setup', 'The top bar', 'Orders', 'First Steps', 'Tasks', 'The night', 'Mornings', 'The Card', 'Heat', 'The map', 'The wheel', 'The Boss Menu', 'Bills', 'Rivals', 'The Founding']);
    expect(TUT.help.options.map((o) => o.id)).toEqual(['full', 'tips', 'off']);
    // The helper is Rotom, never "Claude" or "AI".
    expect(JSON.stringify(TUT)).not.toMatch(/Claude|\bAI\b/);
  });
  it('Settings default to the full walkthrough, and an older settings record still loads', () => {
    expect(DominionPrefsSchema.parse({}).tutorial).toBe('full');
    expect(DominionPrefsSchema.safeParse({ tutorial: 'loud' }).success).toBe(false);
  });
});

describe('Tutorial on the run', () => {
  it('a run without a help level (every older run, every automated test) has no tutorial at all', () => {
    const r = step(begin(), { t: 'open' });
    const b = blk(r);
    expect(b.tut).toBeUndefined();
    expect(tutMode(b)).toBe('off');
    expect(lessonDue(b, 'hq')).toBeNull();
    expect(pageDue(b, true)).toBeNull();
  });

  it('keeps the help level it began with; nothing is due before the opening is read', () => {
    const r = begin('tips');
    expect(blk(r).tut).toEqual({ mode: 'tips', seen: [] });
    expect(pageDue(blk(r), true)).toBeNull();
    expect(lessonDue(blk(r), 'hq')).toBeNull();
  });

  it('Day 1 evening plays the kit, then the welcome and lessons 2 to 5 in order, each once', () => {
    let r = opened();
    expect(pageDue(blk(r), true)).toEqual({ kind: 'kit' });
    expect(pageDue(blk(r), false)).toBeNull();
    r = seenAll(r, 'kit');
    const order: string[] = [];
    for (let n = 0; n < 6; n++) {
      const d = lessonDue(blk(r), 'hq');
      if (!d) break;
      order.push(d.id);
      r = seenAll(r, d.id);
    }
    expect(order).toEqual(['welcome', 'top', 'orders', 'steps', 'tasks']);
    expect(lessonDue(blk(r), 'hq')).toBeNull();
    // Seen twice is still seen once.
    r = seenAll(r, 'top');
    expect(blk(r).tut!.seen.filter((x) => x === 'top')).toHaveLength(1);
  });

  it('lesson 3 moves to its second step once two orders are planned', () => {
    let r = seenAll(opened(), 'kit', 'welcome', 'top');
    expect(lessonDue(blk(r), 'hq')).toMatchObject({ id: 'orders', step: 0 });
    const orders = DOMINION_DATA.start.orders.filter((o) => o.phase === 'day').slice(0, 2);
    for (const o of orders) r = step(r, { t: 'plan', order: o.id });
    expect(lessonDue(blk(r), 'hq')).toMatchObject({ id: 'orders', step: 1 });
  });

  it('the screens\' own lessons show where they belong, and never in Off', () => {
    const r = seenAll(opened(), 'kit');
    expect(lessonDue(blk(r), 'map')).toMatchObject({ id: 'map' });
    expect(lessonDue(blk(r), 'card')).toMatchObject({ id: 'card' });
    expect(lessonDue(blk(r), 'wheel')).toMatchObject({ id: 'wheel' });
    expect(lessonDue(blk(r), 'menu')).toMatchObject({ id: 'menu' });
    expect(lessonDue(blk(r), 'assign')).toMatchObject({ id: 'tasks-assign', lesson: 'tasks', step: 1 });
    expect(lessonDue(blk(r), 'founding', 2)).toMatchObject({ id: 'founding', step: 2 });
    expect(lessonDue(blk(r), 'founding', 9)).toMatchObject({ step: 3 });
    expect(lessonDue(blk(r), 'other')).toBeNull();
    const off = step(r, { t: 'tut', op: 'mode', arg: 'off' });
    expect(lessonDue(blk(off), 'map')).toBeNull();
    expect(pageDue(blk(off), true)).toBeNull();
  });

  it('a bad mode or an empty seen id is refused', () => {
    const r = opened();
    expect(stepInRun(content, r, { t: 'tut', op: 'mode', arg: 'loud' }).ok).toBe(false);
    expect(stepInRun(content, r, { t: 'tut', op: 'seen', arg: '' }).ok).toBe(false);
  });

  it('the Day 2 Rattata goes to the Reserve once, closes lesson 7, and survives a save round trip', () => {
    let r = seenAll(opened(), 'kit');
    expect(stepInRun(content, r, { t: 'tut', op: 'gift', arg: '' }).ok).toBe(false); // Day 1: too early
    const b = structuredClone(blk(r));
    b.day = 2;
    b.phase = 'morning';
    r = { ...r, expansion: { ...r.expansion!, dominion: b } };
    expect(pageDue(blk(r), true)).toEqual({ kind: 'gift' });
    const box = blk(r).reserve?.box.length ?? 0;
    r = step(r, { t: 'tut', op: 'gift', arg: '' });
    expect(blk(r).reserve!.box.length).toBe(box + 1);
    expect(blk(r).reserve!.box.at(-1)!.speciesId).toBe('rattata');
    expect(blk(r).tut!.seen).toEqual(expect.arrayContaining(['gift', 'mornings']));
    // Never twice.
    expect(stepInRun(content, r, { t: 'tut', op: 'gift', arg: '' }).ok).toBe(false);
    const back = DominionBlockSchema.parse(JSON.parse(JSON.stringify(blk(r))));
    expect(back.tut).toEqual(blk(r).tut);
    expect(pageDue(back, true)).not.toEqual({ kind: 'gift' });
    expect(weekOne(back).caught).toContain('rattata');
  });

  it('the bills page, the Rocket note and the Week 1 Ledger follow each other', () => {
    let r = seenAll(opened(), 'kit');
    const b = structuredClone(blk(r));
    b.day = DOMINION_DATA.start.clock.weekLength;
    b.phase = 'morning';
    b.report = ['Week 1 bills: rent ₽200, wages ₽80.'];
    b.tut!.seen.push('gift', 'mornings');
    r = { ...r, expansion: { ...r.expansion!, dominion: b } };
    expect(pageDue(blk(r), true)).toEqual({ kind: 'bills' });
    r = seenAll(r, 'bills-page', 'bills');
    expect(pageDue(blk(r), true)).toEqual({ kind: 'rival' });
    r = seenAll(r, 'rival-note');
    r = seenAll(r, 'welcome', 'top');
    expect(lessonDue(blk(r), 'hq')).toMatchObject({ id: 'rivals' }); // lesson 14, after the note's text
    const ev = structuredClone(blk(r));
    ev.phase = 'evening';
    expect(pageDue(ev, true)).toEqual({ kind: 'week' });
  });

  it('the end of the walkthrough shows in Full only', () => {
    const r = opened('full');
    const b = structuredClone(blk(r));
    b.tut!.seen.push('kit', 'gift', 'bills-page', 'rival-note', 'week', 'gang', 'founded');
    b.team = { name: 'Venom', primary: 'purple', secondary: 'lilac', initial: 'V', logo: 'fang', motto: 'x', goal: null, day: 7 } as unknown as DominionBlock['team'];
    expect(pageDue(b, true)).toEqual({ kind: 'done' });
    b.tut!.mode = 'tips';
    expect(pageDue(b, true)).toBeNull();
  });
});

describe('Tutorial views', () => {
  it('the help page draws three choices with the picked one on', () => {
    const h = helpView(1);
    expect(h).toContain('data-testid="dom-tut-help-full"');
    expect(h).toMatch(/class="ch on"[^>]*data-act="tutHelp" data-arg="1"/);
  });
  it('a tip escapes the names it is given', () => {
    const o = lessonOverlay({ id: 'tasks', lesson: 'tasks', step: 0, full: true, vars: { name: '<i>x</i>' } });
    expect(o).toContain('&lt;i&gt;x&lt;/i&gt;');
    expect(o).toContain('LESSON 5 · TASKS');
  });
  it('the setup tips, the Replay page and the replayed steps', () => {
    expect(setupTip('types', 1, true, true)).toContain(TUT.setup.typesOne);
    expect(setupTip('boss', 0, false, true)).toContain('1 of 3');
    const rp = replayView(0, 'tips', TUT.lessons.map((_, i) => i < 2));
    expect(rp.match(/class="gn">✓/g)).toHaveLength(2);
    expect(lessonSteps('setup', {})).toHaveLength(3);
    expect(lessonSteps('heat', {})).toHaveLength(2);
  });
});
