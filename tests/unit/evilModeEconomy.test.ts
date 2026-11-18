// Evil Mode slice 11: the economy (build plan Part 31 slice 11; design Part 12 sections 1 and 2, Part 13 sections 1 and 2,
// Part 5 sections 2.2 to 2.4). Rackets, Fronts and Works on Honest Cards, upkeep, and bankruptcy's three days.

import { describe, expect, it } from 'vitest';
import { foundForPlay, playRegion, replay } from '../../src/core/evilMode/autoplay';
import { EVIL_DATA, type EvilData } from '../../src/core/evilMode/data';
import { BEAT_END, step, type EvilAction } from '../../src/core/evilMode/day';
import { crewProblem } from '../../src/core/evilMode/dispatch';
import { brokeStage, econDistrictEnd, econEvening, goingStraight, heldStreets, offered, streetMood, tradeCard, tradeReqProblem, ventureDaily } from '../../src/core/evilMode/economy';
import { EconomyFileSchema, EvilModeBlockSchema, type EvilModeBlock, type Holding } from '../../src/core/evilMode/schema';
import { foundTeam, type FoundingChoice } from '../../src/core/evilMode/start';
import { tradeModel, newTrade } from '../../src/core/evilMode/tradeScreens';
import { readFileSync } from 'node:fs';

const choice = (over: Partial<FoundingChoice> = {}): FoundingChoice => ({ name: 'Kettle', creed: 'profit', line: 'grey', doctrine: 'swarm', patron: 'executive', region: 'kanto', ...over });
/** District 1 (Cerulean), no Hero on the road (so nothing walks into a street), at a beat. */
function found(over: Partial<FoundingChoice> = {}, beat: EvilModeBlock['here']['beat'] = 'dispatch'): EvilModeBlock {
  const r = foundTeam(choice(over), { boss: 'red', length: 'three', seed: 'econ-1', stage: 2 });
  if (!r.ok) throw new Error(r.problem);
  return { ...r.block, here: { ...r.block.here, beat }, hero: null };
}
/** The team holds these steps (Persuaded: by share, so a Front can open there). */
const hold = (b: EvilModeBlock, steps: number[], how: Holding['method'] = 'persuade', holds = true): EvilModeBlock => ({
  ...b, district: { ...b.district!, holdings: b.district!.holdings.map((h) => (steps.includes(h.step) ? { ...h, owner: 'team' as const, method: how, since: 1, holds, scouted: 2 } : h)) },
});
const ok = (b: EvilModeBlock, a: EvilAction): EvilModeBlock => {
  const r = step(b, a);
  if (!r.ok) throw new Error(`${a.type} refused: ${r.cues.map((c) => ('reason' in c ? c.reason : c.id)).join('; ')}`);
  return r.block;
};
/** From Dispatch, through the Evening and the night, to the next day's Dispatch. */
function day(b0: EvilModeBlock): EvilModeBlock {
  let b = b0;
  for (let i = 0; i < 12 && !(b.here.beat === 'dispatch' && b.here.day > b0.here.day); i++) {
    if (b.fight) { b = ok(b, { type: 'battleResult', won: false }); continue; }
    b = ok(b, { type: BEAT_END[b.here.beat] });
  }
  return b;
}
const at = (b: EvilModeBlock, beat: EvilModeBlock['here']['beat']): EvilModeBlock => ({ ...b, here: { ...b.here, beat } });
const OFF: EvilData = { ...EVIL_DATA, economy: { ...EVIL_DATA.economy, on: false } };

describe('the Cards: Kanto, hand-written', () => {
  it('about fourteen: six rackets, five Fronts, four Works, all supported', () => {
    const cards = EVIL_DATA.economy.cards;
    expect(cards.length).toBeGreaterThanOrEqual(14);
    expect(cards.filter((c) => c.kind === 'racket')).toHaveLength(6);
    expect(cards.filter((c) => c.kind === 'front')).toHaveLength(5);
    expect(cards.filter((c) => c.kind === 'work')).toHaveLength(4);
    for (const c of cards) {
      expect(c.status).toBe('supported');
      for (const n of c.where) expect(EVIL_DATA.district.districts.some((d) => d.region === 0 && d.n === n)).toBe(true);
      if (c.kind === 'racket') expect(c.honest, c.id).toBeDefined();
    }
  });

  it('every Card has thirteen fields, in order, field 13 never empty, and names somebody', () => {
    const b = hold(found({ creed: 'cause' }), [3, 16, 17], 'pay');
    for (const c of EVIL_DATA.economy.cards) {
      const f = tradeCard({ ...b, district: { ...b.district!, n: c.where[0] ?? 1 } }, { cardId: c.id }, EVIL_DATA);
      expect(f).toHaveLength(13);
      expect(f.map((x) => x.label)).toEqual(EVIL_DATA.ledger.fields);
      expect(f[12]!.text.length, c.id).toBeGreaterThan(10);
      expect(f[2]!.text.toLowerCase(), c.id).toContain(c.names.toLowerCase());
      for (const x of f) expect(x.text.trim().length, `${c.id} ${x.label}`).toBeGreaterThan(0);
    }
  });

  it('a Card with an empty other way fails the data check (and so the build)', () => {
    const raw = JSON.parse(readFileSync('src/data/evilMode/economy.json', 'utf8'));
    raw.cards[0].text.other = '';
    expect(() => EconomyFileSchema.parse(raw)).toThrow();
  });

  it('only the Cards offered in a district show, and none in another district if they are tied to one', () => {
    const b = found();
    const ids = offered(b).map((c) => c.id);
    expect(ids).toContain('bridge');
    expect(ids).not.toContain('dock');
    expect(offered({ ...b, district: { ...b.district!, n: 2 } }).map((c) => c.id)).toContain('dock');
  });
});

describe('rackets (Part 12 section 2)', () => {
  it('starts at Dispatch on a held street: Dread +1, Heat +2 that Evening, and pays at the Evening', () => {
    const b0 = hold(found(), [3]);
    expect(heldStreets(b0)).toEqual([0]);
    expect(step(at(b0, 'morning'), { type: 'trade', req: { cardId: 'protection', street: 0 } }).ok).toBe(false);
    expect(step(b0, { type: 'trade', req: { cardId: 'protection', street: 2 } }).ok).toBe(false);
    const b1 = ok(b0, { type: 'trade', req: { cardId: 'protection', street: 0 } });
    expect(b1.team.dread).toBe(b0.team.dread + 1);
    expect(b1.economy.running[0]).toMatchObject({ cardId: 'protection', street: 0, patience: 5 });
    expect(b1.log.at(-1)!.kind).toBe('econ');
    expect(b1.economy.cards[0]!.fields).toHaveLength(13);
    // A second on the same street: refused.
    expect(step(b1, { type: 'trade', req: { cardId: 'book', street: 0 } }).ok).toBe(false);
    const b2 = day(b1);
    expect(b2.team.heat).toBe(b0.team.heat + 2);
    expect(b2.evening.some((l) => l.startsWith('Rackets'))).toBe(true);
    // Profit: a tenth more; a Books leading: a quarter more again.
    expect(b2.economy.running[0]!.books).toBe(true);
    expect(ventureDaily(b2, b2.economy.running[0]!)).toBe(2750);
    expect(ventureDaily(b2, { ...b2.economy.running[0]!, books: false })).toBe(2200);
  });

  it('the squad is out on trade that day; a person whose line it crosses won\'t go', () => {
    const b1 = ok(hold(found(), [3]), { type: 'trade', req: { cardId: 'balls', street: 0 } });
    const squad = b1.economy.busy.ids;
    expect(squad.length).toBeGreaterThan(0);
    expect(crewProblem(b1, squad[0]!)).toMatch(/out on trade/);
    // Ngozi's line is "Won't short a wage. Anyone's." (racketWork): she isn't sent.
    expect(squad).not.toContain('ngozi');
    expect(b1.economy.cards[0]!.fields.map((f) => (typeof f === "string" ? f : f.text))[7]).toContain('Ngozi');
  });

  it('a Warm street can\'t be racketed; a Clean team can\'t; Belonging only keeps the Tithe; only Cause and Belonging keep a Tithe', () => {
    const b = hold(found(), [11, 12]);
    expect(streetMood({ ...b, district: { ...b.district!, holdings: b.district!.holdings.map((h) => (h.step === 11 ? { ...h, mood: 'warm' as const } : h)) } }, 2)).toBe('warm');
    const warm = { ...b, district: { ...b.district!, holdings: b.district!.holdings.map((h) => (h.step === 11 ? { ...h, mood: 'warm' as const } : h)) } };
    expect(tradeReqProblem(warm, { cardId: 'protection', street: 2 })).toMatch(/Warm/);
    expect(tradeReqProblem(hold(found({ line: 'clean' }), [3]), { cardId: 'protection', street: 0 })).toMatch(/Line/);
    const bel = hold(found({ creed: 'belonging' }), [3]);
    expect(tradeReqProblem(bel, { cardId: 'protection', street: 0 })).toMatch(/neighbours/);
    expect(tradeReqProblem(bel, { cardId: 'tithe', street: 0 })).toBeNull();
    expect(tradeReqProblem(hold(found(), [3]), { cardId: 'tithe', street: 0 })).toMatch(/Cause or Belonging/);
    // The Tithe frightens nobody and its patience is the Roster's.
    const t = ok(bel, { type: 'trade', req: { cardId: 'tithe', street: 0 } });
    expect(t.team.dread).toBe(bel.team.dread);
    expect(t.economy.running[0]!.patience).toBeNull();
  });

  it('patience runs down a day at a time; at none the street Shuts: Heat +2 and what would turn, turns', () => {
    let b = hold(hold(found(), [3]), [5], 'pay', false);
    b = ok(b, { type: 'trade', req: { cardId: 'protection', street: 0 } });
    const heat: number[] = [];
    for (let i = 0; i < 5; i++) { b = day(b); heat.push(b.team.heat); }
    expect(b.economy.running).toHaveLength(0);
    expect(b.evening.some((l) => l.includes('Shut'))).toBe(true);
    expect(b.district!.holdings.find((h) => h.step === 5)!.owner).toBe('nobody');
    expect(b.district!.holdings.find((h) => h.step === 3)!.owner).toBe('team');
    expect(b.log.some((e) => e.kind === 'econ' && e.text.includes('shut on'))).toBe(true);
  });

  it('a waived day pays nothing and buys a day of patience; waiving is at Morning only', () => {
    let b = ok(hold(found(), [3]), { type: 'trade', req: { cardId: 'protection', street: 0 } });
    b = day(b);
    const p = b.economy.running[0]!.patience!;
    const id = b.economy.running[0]!.id;
    expect(step(b, { type: 'venture', id, act: 'waive' }).ok).toBe(false);
    // Back to Morning of the same day to waive.
    let m = ok(at(b, 'morning'), { type: 'venture', id, act: 'waive' });
    m = at(m, 'dispatch');
    const funds = m.team.funds;
    const r = econEvening(m);
    expect(r.income).toBe(0);
    expect(r.block.economy.running[0]!.patience).toBe(p + 1);
    expect(funds).toBe(m.team.funds);
  });

  it('made honest: costs the price less a tenth, pays its honest figure, holds against everything and never Shuts', () => {
    let b = ok(hold(found({ line: 'grey' }), [3], 'pay', false), { type: 'trade', req: { cardId: 'protection', street: 0 } });
    const id = b.economy.running[0]!.id;
    const funds = b.team.funds;
    b = ok(b, { type: 'venture', id, act: 'honest' });
    expect(b.team.funds).toBe(funds - 1350);
    expect(b.economy.running[0]).toMatchObject({ honest: true, patience: null });
    expect(b.district!.holdings.find((h) => h.step === 3)!.holds).toBe(true);
    expect(b.economy.cards.at(-1)!.fields.map((f) => (typeof f === "string" ? f : f.text))[11]).toBe('Kept the street\'s watch, for a wage.');
    for (let i = 0; i < 6; i++) b = day(b);
    expect(b.economy.running.find((v) => v.id === id)).toBeDefined();
    expect(ventureDaily(b, b.economy.running.find((v) => v.id === id)!)).toBe(1000);
  });

  it('at Dread 6+ a street doesn\'t run down, until somebody\'s had enough alone (one in ten, on its own stream)', () => {
    let b = ok(hold(found(), [3]), { type: 'trade', req: { cardId: 'protection', street: 0 } });
    b = { ...b, team: { ...b.team, dread: 7 } };
    const r = econEvening(at(b, 'evening'));
    expect(r.block.draws['evil-economy']).toBe(1);
    expect(r.block.draws['evil-dispatch']).toBe(b.draws['evil-dispatch']);
    const p = r.block.economy.running[0]?.patience;
    expect(p === undefined || p === b.economy.running[0]!.patience).toBe(true);
  });

  it('a racket ends with its district: nobody\'s there to collect', () => {
    const b = ok(hold(found(), [3]), { type: 'trade', req: { cardId: 'protection', street: 0 } });
    const r = econDistrictEnd(b);
    expect(r.block.economy.running).toHaveLength(0);
    expect(r.lines[0]).toMatch(/ends with the district/);
  });
});

describe('Fronts (Part 13 section 1)', () => {
  it('opens only in a holding had by deed, lease or share, with someone of its talent, who then does nothing else', () => {
    const none = found();
    expect(tradeReqProblem(none, { cardId: 'garage' })).toMatch(/deed, lease or share/);
    expect(tradeReqProblem(hold(found(), [3], 'lean'), { cardId: 'garage' })).toMatch(/deed, lease or share/);
    const b0 = hold(found(), [3]);
    expect(tradeReqProblem(b0, { cardId: 'cafe' })).toMatch(/Nobody free has Heart/);
    const b1 = ok(b0, { type: 'trade', req: { cardId: 'garage', holdingId: 's3' } });
    const v = b1.economy.running[0]!;
    expect(v).toMatchObject({ kind: 'front', holdingId: 's3', backRoom: true });
    expect(['faye', 'vikram']).toContain(v.person);
    expect(b1.team.funds).toBe(b0.team.funds - 3000);
    expect(crewProblem(b1, v.person!)).toMatch(/runs The Garage/);
    expect(tradeReqProblem({ ...b1, here: { ...b1.here } }, { cardId: 'allotments', holdingId: 's3' })).toMatch(/Front's already open|deed/);
    // It pays clean, every Evening.
    const r = econEvening(at(b1, 'evening'));
    expect(r.income).toBe(700);
  });

  it('a Front in profit with the back room shut for a whole district counts toward Going Straight; one opened in it doesn\'t', () => {
    let b = ok(hold(found(), [3]), { type: 'trade', req: { cardId: 'garage', holdingId: 's3' } });
    const id = b.economy.running[0]!.id;
    b = ok(b, { type: 'venture', id, act: 'backRoom' });
    expect(b.economy.running[0]!.backRoom).toBe(false);
    // Its own district: opened in it, so not a whole district.
    expect(goingStraight(econDistrictEnd(b).block)).toBe(0);
    // The next district, with the back room shut throughout: it counts.
    const next = { ...b, district: { ...b.district!, n: 2 } };
    expect(goingStraight(econDistrictEnd(next).block)).toBe(1);
    // Opened (even for a moment) in the next district: it doesn't.
    const opened = ok(ok(next, { type: 'venture', id, act: 'backRoom' }), { type: 'venture', id, act: 'backRoom' });
    expect(goingStraight(econDistrictEnd(opened).block)).toBe(0);
  });

  it('the Day-Care has no back room; the Charity pays nothing a day, so it never counts', () => {
    const b = { ...hold(found(), [3, 16]), crew: found().crew.map((c, i) => (i === 1 ? { ...c, talent: 'heart' as const } : c)) };
    const d = ok(b, { type: 'trade', req: { cardId: 'daycare', holdingId: 's3' } });
    const id = d.economy.running[0]!.id;
    expect(d.economy.running[0]!.backRoom).toBeNull();
    expect(step(d, { type: 'venture', id, act: 'backRoom' }).ok).toBe(false);
    const c = ok(d, { type: 'trade', req: { cardId: 'charity', holdingId: 's16' } });
    expect(c.team.regard).toBe(b.team.regard + 2);
    expect(goingStraight(econDistrictEnd({ ...c, district: { ...c.district!, n: 2 } }).block)).toBe(1);
  });
});

describe('Works (Part 13 section 2)', () => {
  it('Light the Town: paid up front, done that Evening: Regard +2, Heat −2 for the first Work here, Given +1; the second in the district cools nothing', () => {
    const b0 = { ...found(), team: { ...found().team, heat: 5 } };
    const b1 = ok(b0, { type: 'trade', req: { cardId: 'light' } });
    expect(b1.team.funds).toBe(b0.team.funds - 3000);
    const r = econEvening(at(b1, 'evening'));
    expect(r.block.economy.running[0]!.done).toBe(true);
    expect(r.block.team.regard).toBe(b0.team.regard + 2);
    expect(r.block.team.heat).toBe(3);
    expect(r.block.given).toBe(b1.given + 1);
    const again = econEvening(at({ ...r.block, economy: { ...r.block.economy, running: [{ ...r.block.economy.running[0]!, id: 'V9', done: false }] } }, 'evening'));
    expect(again.block.team.heat).toBe(3);
    // Once a district.
    expect(tradeReqProblem(at(r.block, 'dispatch'), { cardId: 'light' })).toMatch(/already/);
  });

  it('Mend the Bridge takes two days; Feed the District is upkeep, ₽500 an Evening, and Loyalty +1 for everyone at the start', () => {
    let b = ok(found(), { type: 'trade', req: { cardId: 'bridge' } });
    b = day(b);
    expect(b.economy.running[0]!.done).toBe(false);
    b = day(b);
    expect(b.economy.running[0]!.done).toBe(true);
    const f0 = found();
    const f = ok(f0, { type: 'trade', req: { cardId: 'feed' } });
    expect(f.crew.filter((c) => c.where === 'in').every((c, i) => c.loyalty === Math.min(10, f0.crew.filter((x) => x.where === 'in')[i]!.loyalty + 1))).toBe(true);
    const r = econEvening(at(f, 'evening'));
    expect(r.upkeep).toBe(500);
    expect(r.lines.some((l) => l.startsWith('Upkeep'))).toBe(true);
  });
});

describe('bankrupt (Part 5 section 2.4): three days; none ends the run', () => {
  const broke = () => ({ ...hold(found({ line: 'grey' }), [3]), team: { ...found().team, funds: 0, regard: 5 } });

  it('Short, then Broke (those paid least, −1), then Bust (everyone, −1 a day); paying again ends it', () => {
    let b = broke();
    const L0 = b.crew.map((c) => c.loyalty);
    b = day(b);
    expect(brokeStage(b)).toBe(1);
    expect(b.crew.map((c) => c.loyalty)).toEqual(L0);
    b = day(b);
    expect(brokeStage(b)).toBe(2);
    const grunts = b.crew.filter((c) => c.rank === 'grunt');
    expect(grunts.every((c) => c.loyalty === L0[b.crew.indexOf(c)]! - 1)).toBe(true);
    expect(b.crew.find((c) => c.rank === 'officer')!.loyalty).toBe(L0[0]);
    b = day(b);
    expect(brokeStage(b)).toBe(3);
    expect(b.evening.some((l) => l.startsWith('Bust'))).toBe(true);
    expect(b.district!.end).toBeUndefined();
    expect(b.region.phase).toBe('day');
    // Paid in full again: the count goes back to nothing.
    const paid = day({ ...b, team: { ...b.team, funds: 50000 } });
    expect(brokeStage(paid)).toBe(0);
  });

  it('One Last Job from Broke (once); selling a Front and the Whip-Round from Bust; the Whip-Round wants Regard 4 and comes once a region', () => {
    let b = broke();
    expect(step(b, { type: 'bust', way: 'lastJob' }).ok).toBe(false);
    b = day(day(b));
    const lj = ok(b, { type: 'bust', way: 'lastJob' });
    expect(lj.team.funds).toBe(b.team.funds + 9000);
    expect(lj.team.heat).toBe(Math.min(10, b.team.heat + 4));
    expect(lj.taken).toBe(b.taken + 40);
    expect(lj.economy.cards.at(-1)!.fields).toHaveLength(13);
    expect(step(lj, { type: 'bust', way: 'lastJob' }).ok).toBe(false);
    expect(step(b, { type: 'bust', way: 'whip' }).ok).toBe(false);
    b = day(b);
    expect(step(b, { type: 'bust', way: 'sell' }).ok).toBe(false);
    const w = ok(b, { type: 'bust', way: 'whip' });
    expect(w.team.funds).toBeGreaterThan(b.team.funds);
    expect(w.crew.find((c) => c.where === 'in')!.loyalty).toBe(Math.min(10, b.crew.find((c) => c.where === 'in')!.loyalty + 1));
    expect(step(w, { type: 'bust', way: 'whip' }).ok).toBe(false);
    expect(step({ ...b, team: { ...b.team, regard: 3 } }, { type: 'bust', way: 'whip' }).ok).toBe(false);
  });

  it('a whole region bankrupt every day still ends at the Reckoning, never earlier', () => {
    const b0 = foundForPlay('econ-bust', choice({ creed: 'wonder' }));
    const r = playRegion({ ...b0, team: { ...b0.team, funds: 0 } }, 'persuade');
    expect(r.finished).toBe(true);
  });
});

describe('saves and determinism', () => {
  it('v8 -> v9: nothing running, nobody out, not bankrupt, the new stream at 0; a running racket survives a reload', () => {
    const b = found();
    const { economy: _e, ...rest } = b;
    const { 'evil-economy': _s, ...draws } = b.draws;
    const v8 = { ...rest, v: 8, draws };
    const v9 = EvilModeBlockSchema.parse(v8);
    expect(v9.v).toBe(23);
    expect(v9.economy).toEqual({ running: [], busy: { day: 0, ids: [] }, loud: null, broke: 0, lastJob: false, whip: [], worksIn: [], cards: [] });
    expect(v9.draws['evil-economy']).toBe(0);
    const ran = ok(hold(found(), [3]), { type: 'trade', req: { cardId: 'protection', street: 0 } });
    expect(EvilModeBlockSchema.parse(JSON.parse(JSON.stringify(ran)))).toEqual(ran);
    // A damaged venture is refused, not dropped silently.
    expect(EvilModeBlockSchema.safeParse({ ...ran, economy: { ...ran.economy, running: [{ ...ran.economy.running[0]!, kind: 'heist' }] } }).success).toBe(false);
  });

  it('with the economy off: no Card is offered and a short Evening works as before', () => {
    const b = hold(found(), [3]);
    expect(offered(b, OFF)).toEqual([]);
    expect(econEvening(b, OFF)).toMatchObject({ income: 0, upkeep: 0, loud: null });
    expect(tradeModel(b, newTrade(), OFF)).toBeNull();
  });

  it('a region with trade replays from its action list to the same block', () => {
    const b0 = foundForPlay('econ-replay', choice({ creed: 'profit', line: 'grey' }));
    const r = playRegion(b0, 'mix');
    expect(r.finished).toBe(true);
    expect(r.actions.some((a) => a.type === 'trade')).toBe(true);
    expect(replay(b0, r.actions)).toEqual(r.block);
  });
});

describe('the Trade page', () => {
  it('four tabs; a racket shows its Card with the button under field 13; a shut one says why', () => {
    const b = hold(found(), [3]);
    const m = tradeModel(b, newTrade(0))!;
    expect(m.tabs.map((t) => t.name)).toEqual(['Rackets', 'Fronts', 'Works', 'Running']);
    expect(m.card).toHaveLength(13);
    expect(m.buttons[0]!.label).toBe('Do it');
    const fronts = tradeModel(found(), newTrade(1))!;
    expect(fronts.buttons[0]!.problem).toMatch(/deed, lease or share/);
    const running = tradeModel(ok(b, { type: 'trade', req: { cardId: 'protection', street: 0 } }), newTrade(3))!;
    expect(running.rows[0]!.name).toContain('Protection');
    expect(running.buttons.map((x) => x.label)).toEqual(['Make it honest: The Watch', 'Waive today', 'End it']);
  });
});
