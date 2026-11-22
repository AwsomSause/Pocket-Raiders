// DOMINION redesign R4: the pass-50 Jobs pages' own rules (core/dominion/jobs.ts). The Job board, "something happens"
// on a stealth job, the calling card, the Black Market, smuggling cargo and the battle album. Every rule is a session
// step; the board, the live question and the market's stock are pure (they never change the block or draw a stream).
import { describe, expect, it } from 'vitest';
import raw from '../../src/data/dominion/jobs.json';
import { freshChair } from '../../src/core/dominion/chair';
import { DOMINION_DATA } from '../../src/core/dominion/data';
import { card, settle } from '../../src/core/dominion/field';
import { growthOf } from '../../src/core/dominion/growth';
import { callingDue, cargoOf, cargoOpt, JOBX, jobBoard, liveChance, liveOf, marketOpen, marketStock } from '../../src/core/dominion/jobs';
import { DominionBlockSchema, type DominionAction, type DominionBlock } from '../../src/core/dominion/schema';
import { DOMINION_MODE_ID, startInRun, stepInRun } from '../../src/core/dominion/session';
import { STANDARD_CHOICE } from '../../src/core/rules';
import { chooseStarter, createRun } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
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
const day = (seed = 'jobs'): RunState => go(talks(go(go(go(started(seed), { t: 'open' }), { t: 'toNight' }), { t: 'rest' })), { t: 'toDay' });

const SCOUT = { action: 'scout', target: 'pewter-mart', district: 'pewter', bring: [] as string[] };
/** A Day-2 run whose next Scout at the Pewter Mart has "something happens". */
function liveRun(): RunState {
  for (let i = 0; i < 200; i++) {
    const r = day(`jobs-live-${i}`);
    const c = card(blk(r), r, SCOUT.action, SCOUT.target, SCOUT.district, []);
    if (c && liveOf(blk(r), r.seed, c)) return r;
  }
  throw new Error('no seed');
}

describe('R4 jobs.json', () => {
  it('parses; the market sells real items; cargo ids are unique', () => {
    expect(JOBX._source).toBe(raw._source);
    for (const it of JOBX.market.items) expect(content.items.has(it.id) || ['supported', 'existing'].includes(content.catalog.get(it.id)?.status ?? ''), it.id).toBe(true);
    expect(new Set(JOBX.cargo.items.map((x) => x.id)).size).toBe(JOBX.cargo.items.length);
    expect(JOBX.market.stock).toBeLessThanOrEqual(JOBX.market.items.length);
  });
});

describe('R4 the Job board', () => {
  it('lists up to three different jobs the Boss can do now, best first, and never changes the block', () => {
    const r = day();
    const before = structuredClone(blk(r));
    const jobs = jobBoard(blk(r), r);
    expect(jobs.length).toBeGreaterThan(0);
    expect(jobs.length).toBeLessThanOrEqual(3);
    expect(new Set(jobs.map((j) => j.action)).size).toBe(jobs.length);
    for (const j of jobs) {
      expect(j.card.blocked).toBeNull();
      expect(j.card.def.slot).toBe('day');
    }
    for (let i = 1; i < jobs.length; i++) expect(jobs[i - 1]!.score).toBeGreaterThanOrEqual(jobs[i]!.score);
    expect(blk(r)).toEqual(before);
    expect(jobBoard(blk(r), r)).toEqual(jobs);
  });

  it('is empty in the morning', () => {
    const r = started('jobs-morning');
    expect(jobBoard({ ...blk(r), phase: 'morning' }, r)).toEqual([]);
  });
});

describe('R4 something happens (live)', () => {
  it('only a stealth job that rolls can ask; the question is the same every time it is asked', () => {
    const r = liveRun(), b = blk(r);
    const c = card(b, r, SCOUT.action, SCOUT.target, SCOUT.district, [])!;
    expect(liveOf(b, r.seed, c)).toEqual(liveOf(b, r.seed, c));
    const ex = card(b, r, 'extort', 'pewter-mart', 'pewter', [])!;
    expect(liveOf(b, r.seed, ex)).toBeNull();
  });

  it('Stay still uses Stealth against their watch; Grab it and run costs odds and Heat', () => {
    const r = liveRun(), b = blk(r);
    const c = card(b, r, SCOUT.action, SCOUT.target, SCOUT.district, [])!;
    const ev = liveOf(b, r.seed, c)!;
    const O = DOMINION_DATA.field.odds;
    expect(liveChance(c, ev, 'still')).toBe(Math.max(O.min, Math.min(O.max, c.chance + (ev.stat - ev.watch) * JOBX.live.per)));
    expect(liveChance(c, ev, 'run')).toBe(Math.max(O.min, Math.min(O.max, c.chance + JOBX.live.runOdds)));
    const out = stepInRun(content, r, { t: 'act', ...SCOUT, live: 'run' });
    expect(out.ok).toBe(true);
    expect(out.roll?.chance).toBe(liveChance(c, ev, 'run'));
  });

  it('a Smoke Ball needs one; with one it ends the job cleanly (nothing rolled, nobody grabbed, the paper says botched)', () => {
    const r = liveRun();
    delete r.inventory['smoke-ball'];
    const no = stepInRun(content, r, { t: 'act', ...SCOUT, live: 'smoke' });
    expect(no.ok).toBe(false);
    expect(no.notice).toBe(JOBX.live.noSmoke);
    r.inventory['smoke-ball'] = 1;
    const rolls = blk(r).field.rolls;
    const out = stepInRun(content, r, { t: 'act', ...SCOUT, live: 'smoke' });
    expect(out.ok).toBe(true);
    expect(out.roll ?? null).toBeNull();
    expect(out.run.inventory['smoke-ball']).toBeUndefined();
    const b = blk(out.run);
    expect(b.field.rolls).toBe(rolls + 1);
    expect(b.paper?.jobs.at(-1)?.res).toBe('botched');
    expect(b.paper?.caught ?? null).toBeNull();
    expect(b.actions).toBe(blk(r).actions - 1);
  });

  it('an answer on a job where nothing happens changes nothing', () => {
    for (let i = 0; i < 200; i++) {
      const r = day(`jobs-quiet-${i}`);
      const c = card(blk(r), r, SCOUT.action, SCOUT.target, SCOUT.district, [])!;
      if (liveOf(blk(r), r.seed, c)) continue;
      const a = stepInRun(content, r, { t: 'act', ...SCOUT });
      const b = stepInRun(content, r, { t: 'act', ...SCOUT, live: 'run' });
      expect(blk(b.run)).toEqual(blk(a.run));
      return;
    }
    throw new Error('no seed');
  });
});

describe('R4 the calling card', () => {
  /** A Day-2 Extort at the Pewter Mart that passes (or fails) with no fight. */
  function extort(want: boolean): RunState {
    for (let i = 0; i < 120; i++) {
      const r = day(`jobs-cc-${i}`);
      const out = stepInRun(content, r, { t: 'act', action: 'extort', target: 'pewter-mart', district: 'pewter', bring: [] });
      if (!out.ok || out.fight || !out.roll) continue;
      if ((out.roll.r <= out.roll.chance) === want && !blk(out.run).police?.q) return out.run;
    }
    throw new Error('no seed');
  }

  it('signs the job just done: Dread up, Regard down, Heat up, once', () => {
    const r = extort(true), b = blk(r);
    expect(callingDue(b)).not.toBeNull();
    const ds = b.field.districts.pewter!;
    const after = go(r, { t: 'calling' });
    const d2 = blk(after).field.districts.pewter!;
    expect(d2.dread).toBe(ds.dread + JOBX.calling.dread);
    expect(d2.regard).toBe(ds.regard + JOBX.calling.regard);
    expect(d2.heat).toBeGreaterThan(ds.heat);
    expect(callingDue(blk(after))).toBeNull();
    expect(stepInRun(content, after, { t: 'calling' }).ok).toBe(false);
    expect(() => DominionBlockSchema.parse(blk(after))).not.toThrow();
  });

  it('a botched job has no card to leave', () => {
    const r = extort(false);
    expect(callingDue(blk(r))).toBeNull();
    const out = stepInRun(content, r, { t: 'calling' });
    expect(out.ok).toBe(false);
    expect(out.notice).toBe(JOBX.calling.notNow);
  });
});

describe('R4 the Black Market', () => {
  const evening = (): RunState => {
    const r = go(day('jobs-bm'), { t: 'endDay' });
    expect(blk(r).phase).toBe('evening');
    return r;
  };

  it('is shut by day and without a contact', () => {
    const r = day('jobs-bm');
    growthOf(blk(r)).contacts.push('fence');
    expect(marketOpen(blk(r))).toBe(false);
    const e = evening();
    expect(marketOpen(blk(e))).toBe(false);
    const out = stepInRun(content, e, { t: 'market', item: marketStock(e.seed, blk(e).day)[0]!.id });
    expect(out.ok).toBe(false);
    expect(out.notice).toBe(JOBX.market.closed);
  });

  it('the same stock all night; buying spends money and adds the item; not enough money is refused', () => {
    const r = evening();
    growthOf(blk(r)).contacts.push('fence');
    expect(marketOpen(blk(r))).toBe(true);
    const stock = marketStock(r.seed, blk(r).day);
    expect(stock).toHaveLength(JOBX.market.stock);
    expect(marketStock(r.seed, blk(r).day)).toEqual(stock);
    const it = stock[0]!;
    blk(r).funds = it.price + 5;
    const had = r.inventory[it.id] ?? 0;
    const out = go(r, { t: 'market', item: it.id });
    expect(blk(out).funds).toBe(5);
    expect(out.inventory[it.id]).toBe(had + 1);
    const no = stepInRun(content, out, { t: 'market', item: it.id });
    expect(no.ok).toBe(false);
    expect(no.notice).toBe(JOBX.market.noMoney);
    const gone = JOBX.market.items.find((x) => !stock.some((s) => s.id === x.id));
    if (gone) expect(stepInRun(content, out, { t: 'market', item: gone.id }).ok).toBe(false);
  });
});

describe('R4 smuggling cargo', () => {
  it('each crate lowers the ticket check by its risk and adds its pay; the load reads back in list order', () => {
    const r = day('jobs-cargo'), b = blk(r);
    const empty = card(b, r, 'smuggle', null, 'pewter', [], null)!;
    expect(empty.opts.map((o) => o.id)).toEqual(JOBX.cargo.items.map((x) => x.id));
    const load = card(b, r, 'smuggle', null, 'pewter', [], 'gems+balls+nope')!;
    expect(load.opt).toBe('balls+gems');
    const risk = cargoOf(load.opt).reduce((a, x) => a + x.risk, 0), pay = cargoOf(load.opt).reduce((a, x) => a + x.pay, 0);
    const O = DOMINION_DATA.field.odds;
    expect(load.chance).toBe(Math.max(O.min, Math.min(O.max, empty.chance - risk * JOBX.cargo.riskOdds)));
    expect(load.pay).toEqual([empty.pay![0] + pay, empty.pay![1] + pay]);
    expect(cargoOpt([])).toBeNull();
  });
});

describe('R4 the battle album', () => {
  it('a won big fight offers a snapshot; Save keeps it, Skip drops it', () => {
    const r = day('jobs-snap');
    const b = structuredClone(blk(r));
    b.field.fight = { why: 'hero', foe: 'hero', begun: true, action: null, target: null, district: 'pewter', pass: false, big: false, wager: 0, racket: null, lead: 'charizard' };
    settle(content, b, r, 'win', null);
    expect(b.jobx?.snap?.foe).toBe('charizard');
    const r2 = { ...r, expansion: { ...r.expansion, dominion: DominionBlockSchema.parse(b) } };
    const kept = go(r2, { t: 'snap', keep: true });
    expect(blk(kept).jobx?.album).toHaveLength(1);
    expect(blk(kept).jobx?.snap).toBeNull();
    const skipped = go(r2, { t: 'snap', keep: false });
    expect(blk(skipped).jobx?.album).toHaveLength(0);
    expect(stepInRun(content, skipped, { t: 'snap', keep: true }).ok).toBe(false);
  });

  it('a lost fight, or a small one, offers nothing', () => {
    const r = day('jobs-snap2');
    const b = structuredClone(blk(r));
    b.field.fight = { why: 'fail', foe: 'target', begun: true, action: 'extort', target: 'pewter-mart', district: 'pewter', pass: false, big: false, wager: 0, racket: null, lead: 'geodude' };
    settle(content, b, r, 'win', null);
    expect(b.jobx?.snap ?? null).toBeNull();
  });
});
