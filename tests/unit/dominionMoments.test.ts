// DOMINION slice D30: job moments (m8 Boss order cut-in, m9 Job done, m10 Job botched) and the morning paper (m12).
// The moments only present what `act` did and saved: the models never change the block and pick their lines on their
// own stream. The paper reads the job notes and the World Turn's morning snapshots.
import { describe, expect, it } from 'vitest';
import momentsRaw from '../../src/data/dominion/moments.json';
import { freshChair } from '../../src/core/dominion/chair';
import { DOMINION_DATA } from '../../src/core/dominion/data';
import { card } from '../../src/core/dominion/field';
import { bountyOf, jobModel, MOMENTS, MomentsFileSchema, noteJob, orderModel, paperDue, paperModel, snapOf, starsOf } from '../../src/core/dominion/moments';
import { DominionBlockSchema, type DominionAction, type DominionBlock } from '../../src/core/dominion/schema';
import { DOMINION_MODE_ID, startInRun, stepInRun } from '../../src/core/dominion/session';
import { STANDARD_CHOICE } from '../../src/core/rules';
import { chooseStarter, createRun } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { jobBotchedView, jobDoneView, orderView, paperView } from '../../src/ui/redux/screens/dominion/moments';
import { topModel } from '../../src/core/dominion/screens';
import { content } from './helpers';

const domRun = (seed: string): RunState => chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red', rules: { ...STANDARD_CHOICE, modeId: DOMINION_MODE_ID } }), 0);
const started = (seed: string): RunState => {
  const out = startInRun(content, domRun(seed), { types: ['poison', 'dark'], member: 'grunt', look: 0 });
  expect(out.problem).toBeNull();
  const r = structuredClone(out.run);
  r.expansion!.dominion!.chair = { ...freshChair(), opts: { length: 'off', numbers: 'arrows', speed: 'normal' } };
  return r;
};
const blk = (r: RunState): DominionBlock => r.expansion!.dominion!;
const go = (r: RunState, a: DominionAction): RunState => {
  const out = stepInRun(content, r, a);
  expect(out.ok, out.notice ?? '').toBe(true);
  return out.run;
};
const talks = (r: RunState): RunState => {
  while (blk(r).crew?.talks.length) r = go(r, { t: 'talk', choice: 0 });
  return r;
};
/** Day 2, the Day phase (rested). */
const day = (seed = 'd30'): RunState => go(talks(go(go(go(started(seed), { t: 'open' }), { t: 'toNight' }), { t: 'rest' })), { t: 'toDay' });
/** Day -> Evening -> Night -> the next Morning (the World Turn ran). */
const nextMorning = (r: RunState): RunState => talks(go(go(talks(go(r, { t: 'endDay' })), { t: 'toNight' }), { t: 'rest' }));
const EXTORT = { action: 'extort', target: 'pewter-mart', district: 'pewter', bring: [] as string[] };
/** Day 2 Extort at the Pewter Mart: the first seed whose roll passes (or fails), with no battle or police after it. */
function extort(want: boolean) {
  for (let i = 0; i < 80; i++) {
    const r = day(`d30-${i}`);
    const out = stepInRun(content, r, { t: 'act', ...EXTORT });
    if (!out.ok || out.fight || !out.roll) continue;
    if ((out.roll.r <= out.roll.chance) === want && !out.run.expansion!.dominion!.police?.q) return { before: r, out };
  }
  throw new Error('no seed');
}

describe('DOMINION D30: the lines (moments.json)', () => {
  it('parses, every stat has order lines, and no player text names Claude or AI', () => {
    expect(MomentsFileSchema.safeParse(momentsRaw).success).toBe(true);
    for (const k of ['brawn', 'nerve', 'wits', 'charm', 'stealth', 'any'] as const) expect(MOMENTS.order.boss[k].length).toBeGreaterThan(0);
    const text = JSON.stringify({ ...momentsRaw, _source: '' });
    expect(text).not.toMatch(/Claude|\bAI\b/);
  });
  it('a damaged file is refused (side stories must pair with their bodies)', () => {
    const bad = structuredClone(momentsRaw);
    bad.paper.sideQuietBody = bad.paper.sideQuietBody.slice(1);
    expect(MomentsFileSchema.safeParse(bad).success).toBe(false);
  });
});

describe('DOMINION D30: Do it returns the roll; the moments only show it', () => {
  it('the act hands back what it rolled, and the save is the same with or without the moment', () => {
    const { before, out } = extort(true);
    const c = card(blk(before), before, 'extort', 'pewter-mart', 'pewter')!;
    expect(out.roll).toEqual({ r: out.roll!.r, chance: c.chance, rolled: true });
    const after = structuredClone(blk(out.run)), was = structuredClone(blk(before));
    const o = orderModel(blk(before), before, EXTORT)!;
    const j = jobModel(blk(before), blk(out.run), out.run, EXTORT, out.roll!, out.notice);
    expect(blk(out.run)).toEqual(after);
    expect(blk(before)).toEqual(was);
    expect(o.verb).toBe('EXTORT');
    expect(o.sub).toContain(`${c.chance}%`);
    expect(MOMENTS.order.boss.nerve.map((l) => l.replace('{owner}', c.target!.owner.name))).toContain(o.boss);
    expect(j?.kind).toBe('done');
  });
  it('Job done lists the take and every change with before and after, and the weekly racket', () => {
    const { before, out } = extort(true);
    const b0 = blk(before), b1 = blk(out.run);
    const j = jobModel(b0, b1, out.run, EXTORT, out.roll!, out.notice)!;
    expect(j.take).toBe(b1.funds - b0.funds);
    expect(j.take).toBeGreaterThan(0);
    expect(j.stamp).toMatch(/PAID IN FULL|BIG SCORE/);
    expect(j.rolled).toBe(`rolled ${out.roll!.r} under ${out.roll!.chance}`);
    const funds = j.changes.find((x) => x.label === 'Funds')!;
    expect(funds.from).toBe(`₽${b0.funds.toLocaleString('en-US')} → ₽${b1.funds.toLocaleString('en-US')}`);
    const heat = j.changes.find((x) => x.label === 'Heat in Pewter')!;
    expect(heat.d).toBe(`+${b1.field.districts.pewter!.heat - b0.field.districts.pewter!.heat}`);
    expect(j.weekly).toMatch(/Pewter Mart now pays ₽\d+ every week/);
    expect(j.lines).toBe(out.notice);
  });
  it('Job botched: BOTCHED, rolled over, what it cost, and the two ways on when nobody was caught', () => {
    const { before, out } = extort(false);
    const j = jobModel(blk(before), blk(out.run), out.run, EXTORT, out.roll!, out.notice)!;
    expect(j.kind).toBe('botched');
    expect(j.stamp).toBe('BOTCHED');
    expect(j.take).toBe(0);
    expect(j.rolled).toBe(`rolled ${out.roll!.r} over ${out.roll!.chance}`);
    expect(j.caught).toBeNull();
    expect(j.head).toMatch(/got away/);
    const html = jobBotchedView(j, MOMENTS.botched, 0, null, false);
    expect(html).toContain('dom-job-choice-1');
    expect(html).toContain('POLICE LINE');
  });
  it('a caught member points at the questioning (D24 owns the screen next)', () => {
    const { before, out } = extort(false);
    const b1 = structuredClone(blk(out.run));
    b1.police = { n: 1, q: { n: 1, who: 'boss', name: 'BOSS' } as never, last: null, evidence: [], rolls: 0 } as never;
    const j = jobModel(blk(before), b1, out.run, EXTORT, out.roll!, out.notice)!;
    expect(j.caught).toBe('You');
    expect(j.head).toBe('You were caught. What now?');
    const html = jobBotchedView(j, MOMENTS.botched, 0, null, false);
    expect(html).toContain('Face the police');
    expect(html).not.toContain('dom-job-choice-1');
  });
  it('the same act shows the same lines (own stream; nothing in the run moves)', () => {
    const { before } = extort(true);
    expect(orderModel(blk(before), before, EXTORT)).toEqual(orderModel(blk(before), before, EXTORT));
    expect(blk(before).field.rolls).toBe(blk(day('d30-0')).field.rolls);
  });
  it('the views draw the mockups\' pieces and name nobody Claude', () => {
    const { before, out } = extort(true);
    const o = orderModel(blk(before), before, EXTORT)!;
    const j = jobModel(blk(before), blk(out.run), out.run, EXTORT, out.roll!, out.notice)!;
    const a = orderView(o, null, false), d = jobDoneView(j, topModel(blk(out.run)), null, true);
    expect(a).toContain('ORDER: EXTORT');
    expect(a).toContain('band boss');
    expect(d).toContain('dom-job-stamp');
    expect(d).toContain(' still');
    expect(a + d).not.toMatch(/Claude/);
  });
});

describe('DOMINION D30: the morning paper (m12)', () => {
  it('each act leaves a note; the next morning prints it on the front page with the news panel', () => {
    const { out } = extort(true);
    const b = blk(out.run);
    expect(b.paper!.jobs.at(-1)).toMatchObject({ d: 2, a: 'extort', t: 'pewter-mart', at: 'pewter' });
    expect(['done', 'big']).toContain(b.paper!.jobs.at(-1)!.res);
    const m3 = nextMorning(out.run);
    const b3 = blk(m3);
    expect(b3.day).toBe(3);
    expect(paperDue(b3)).toBe(true);
    expect(b3.paper!.snap!.d).toBe(3);
    expect(b3.paper!.prev!.d).toBe(2);
    const p = paperModel(b3, m3.seed);
    expect(p.masthead).toBe('The Kanto Ledger');
    expect(p.dateline[0]).toBe('Day 3 · Morning edition');
    expect(p.head.toUpperCase()).toContain('PEWTER');
    expect(p.column).toMatch(/report number 1 this week/);
    expect(p.rows[0]!.label).toBe('Notoriety');
    expect(p.side).toHaveLength(2);
    expect(paperModel(b3, m3.seed)).toEqual(p);
    const html = paperView(p, null);
    expect(html).toContain('dom-paper-wanted');
    expect(html).toContain('Fold the paper');
  });
  it('a night with no jobs is a quiet paper; notes older than yesterday drop', () => {
    const m3 = nextMorning(day('quiet'));
    const p = paperModel(blk(m3), m3.seed);
    expect(MOMENTS.paper.heads.quiet.map((h) => h.replace('{REGION}', 'KANTO'))).toContain(p.head);
    const m4 = nextMorning(go(m3, { t: 'toDay' }));
    expect(blk(m4).paper!.jobs.every((j) => j.d >= blk(m4).day - 1)).toBe(true);
  });
  it('no paper on Day 1 or outside the Morning', () => {
    const r = day();
    expect(paperDue(blk(r))).toBe(false);
    expect(paperDue(blk(go(started('p1'), { t: 'open' })))).toBe(false);
  });
  it('the bounty follows Wanted and Notoriety; stars spread the ladder over five (boundaries)', () => {
    const k = MOMENTS.paper.bounty;
    expect(bountyOf(0, 0)).toBe(k.base);
    expect(bountyOf(10, 0)).toBe(k.base + 10 * k.perWanted);
    expect(starsOf(0)).toBe(0);
    const top = DOMINION_DATA.empire.notoriety.steps.at(-1)!;
    expect(starsOf(top.min + 1000)).toBe(5);
  });
  it('the paper changes nothing in the run', () => {
    const m3 = nextMorning(extort(true).out.run);
    const was = structuredClone(blk(m3));
    paperModel(blk(m3), m3.seed);
    expect(blk(m3)).toEqual(was);
  });
});

describe('DOMINION D30: the save block (paper, optional, no bump)', () => {
  it('a block without `paper` loads; a snapshot round-trips; a damaged note is refused', () => {
    const r = day();
    const b = structuredClone(blk(r));
    delete b.paper;
    expect(DominionBlockSchema.safeParse(b).success).toBe(true);
    noteJob(b, blk(r), EXTORT, { r: 10, chance: 50, rolled: true }, false);
    b.paper!.snap = snapOf(b);
    const back = DominionBlockSchema.parse(JSON.parse(JSON.stringify(b)));
    expect(back.paper).toEqual(b.paper);
    const bad = structuredClone(b);
    (bad.paper!.jobs[0] as { res: string }).res = 'nope';
    expect(DominionBlockSchema.safeParse(bad).success).toBe(false);
  });
});
