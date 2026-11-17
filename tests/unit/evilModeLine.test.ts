// Evil Mode slice 6 ("the Line"): Lean, Take, Expose; Heat by the loudest job; the lamps' words; Dread; the Line's three
// stops, refused in `step`; moving the Line once a region; the team's real Line; three more ways to leave; the v6 save.
// Normal, boundary and failure cases. Standing test 13: Clean hands can win the district.
import { describe, expect, it } from 'vitest';
import { boardModel, newDispatch } from '../../src/core/evilMode/boardScreens';
import { cardFor } from '../../src/core/evilMode/card';
import { EVIL_DATA } from '../../src/core/evilMode/data';
import { step, type EvilAction } from '../../src/core/evilMode/day';
import { jobProblem, resolveEvening } from '../../src/core/evilMode/dispatch';
import { goWithHero, heartsGo, heatForecast, heatStep, linePreview, proofFor, realLine } from '../../src/core/evilMode/line';
import { lineModel } from '../../src/core/evilMode/lineScreens';
import { crossers } from '../../src/core/evilMode/people';
import { frameModel } from '../../src/core/evilMode/screens';
import { EvilModeBlockSchema, firstCrew, type Crew, type EvilModeBlock, type Holding, type Job } from '../../src/core/evilMode/schema';
import { foundTeam } from '../../src/core/evilMode/start';

const found = (line: 'clean' | 'grey' | 'whatever' = 'grey', seed = 'line1', n = 6): EvilModeBlock => {
  const r = foundTeam({ name: 'Kettle', creed: 'profit', line, doctrine: 'swarm' }, { boss: 'red', length: 'three', seed, stage: 2 });
  if (!r.ok) throw new Error(r.problem);
  return { ...r.block, crew: firstCrew(n, 6), applicants: [] };
};
const go = (b: EvilModeBlock, a: EvilAction): EvilModeBlock => {
  const r = step(b, a);
  if (!r.ok) throw new Error(JSON.stringify(r.cues));
  return r.block;
};
const toDispatch = (b: EvilModeBlock) => go(b, { type: 'dismissOvernight' });
const toNight = (b: EvilModeBlock) => {
  for (const t of ['dismissOvernight', 'send', 'stayIn', 'callItADay'] as const) if (b.here.beat !== 'night') b = go(b, { type: t });
  return b;
};
const local = (b: EvilModeBlock, f: (h: Holding) => boolean = () => true) => b.district!.holdings.find((h) => h.kind === 'local' && f(h))!;
const setLocal = (b: EvilModeBlock, id: string, ref: string, extra: Partial<Holding> = {}): EvilModeBlock => ({ ...b, district: { ...b.district!, holdings: b.district!.holdings.map((h) => (h.id === id ? { ...h, ref, ...extra } : h)) } });
/** The Evening with each job's odds forced (100 = it goes, 0 = it doesn't): the rolls themselves are tested in slice 2. */
const evening = (b: EvilModeBlock, jobs: (Omit<Job, 'odds' | 'certain' | 'terms'> & { odds: number })[]): EvilModeBlock =>
  resolveEvening({ ...b, here: { ...b.here, beat: 'evening' }, queue: jobs.map((j, i) => ({ cardId: `T${i + 1}`, ...j, certain: j.odds === 100, terms: [] })) });
const person = (b: EvilModeBlock, id: string, p: Partial<Crew>): EvilModeBlock => ({ ...b, crew: b.crew.map((c) => (c.id === id ? { ...c, ...p } : c)) });

describe('the Line: three stops, refused in step', () => {
  it('Clean hands: Lean and Take are shown, refused with the Line named, and refused by step (not only on screen)', () => {
    const b = toDispatch(found('clean'));
    const h = local(b);
    for (const method of ['lean', 'take'] as const) {
      const job = { holdingId: h.id, method, squad: ['g1', 'g2', 'g3'], ...(method === 'take' ? { thing: 'stock' as const } : {}) };
      expect(jobProblem(b, job)).toBe('Not on a Clean hands team.');
      const r = step(b, { type: 'queueJob', job });
      expect(r.ok).toBe(false);
      expect(r.block).toBe(b);
    }
    const m = boardModel(b, { ...newDispatch(), step: 'how', at: h.step - 1 });
    const lean = m.dispatch!.methods.find((x) => x.id === 'lean')!;
    expect(lean.on).toBe(false);
    expect(lean.dark).toBe('Not on a Clean hands team.');
    expect(m.dispatch!.methods.find((x) => x.id === 'expose')!.on).toBe(true);
  });
  it('Grey lights all seven; a Lean needs a squad of three (boundary: two is refused)', () => {
    const b = toDispatch(found('grey'));
    const h = local(b, (x) => x.ref !== 'amadi');
    expect(jobProblem(b, { holdingId: h.id, method: 'lean', squad: ['g1', 'g2'] })).toBe('A Lean needs a squad of 3.');
    expect(jobProblem(b, { holdingId: h.id, method: 'lean', squad: ['g1', 'g2', 'g3'] })).toBeNull();
  });
  it('a child is never Leaned on or Taken from, whatever the Line (the minors\' enumeration)', () => {
    for (const line of ['grey', 'whatever'] as const) {
      const b0 = toDispatch(found(line));
      const h = local(b0);
      const b = setLocal(b0, h.id, 'amadi');
      for (const method of ['lean', 'take', 'expose'] as const) expect(step(b, { type: 'queueJob', job: { holdingId: h.id, method, squad: ['g1', 'g2', 'g3'], thing: 'stock' } }).ok).toBe(false);
    }
  });
  it('a dark method names who won\'t, and asking anyway is refused in the yard', () => {
    const b0 = toDispatch(found('grey'));
    const h = local(b0, (x) => x.ref === 'eze') ?? local(b0);
    const b = setLocal(person(b0, 'g2', { line: 13, lineHeard: false, name: 'Faye' }), h.id, 'eze', { scouted: 1 });
    const job = { holdingId: h.id, method: 'lean' as const, squad: ['g1', 'g2', 'g3'] };
    expect(crossers(b, job).map((c) => c.name)).toEqual(['Faye']);
    const q = step(b, { type: 'queueJob', job });
    expect(q.ok).toBe(false);
    expect(q.cues[0]).toMatchObject({ reason: expect.stringContaining('Faye') });
    expect(cardFor(b, job).fields[7]!.text).toContain('Faye');
    const asked = step(b, { type: 'askAnyway', job });
    expect(asked.ok).toBe(true);
    expect(asked.block.refusal?.who).toEqual(['g2']);
    expect(asked.block.crew.find((c) => c.id === 'g2')!.lineHeard).toBe(true);
  });
});

describe('Lean, Take, Expose at the Evening', () => {
  it('Lean that goes: yours, would turn, half as much again, Dread +1, Sullen; Taken +3', () => {
    const b0 = found('grey');
    const h = local(b0);
    const b = setLocal(b0, h.id, 'eze');
    const out = evening(b, [{ holdingId: h.id, method: 'lean', squad: ['g1', 'g2', 'g3'], odds: 100 }]);
    const x = out.district!.holdings.find((y) => y.id === h.id)!;
    expect(x).toMatchObject({ owner: 'team', method: 'lean', holds: false, mood: 'sullen' });
    expect(out.team.dread).toBe(b.team.dread + 1);
    expect(out.taken).toBe(b.taken + EVIL_DATA.line.lean.taken);
    expect(out.evening.some((l) => l.includes(`₽${Math.floor((300 * 150) / 100)}`) || l.startsWith('Takings'))).toBe(true);
  });
  it('Lean that fails: Shut, the street one colder with no roll, the squad −1 each (a Heart\'s untouched), Heat +3', () => {
    const b0 = person(person(found('grey'), 'g1', { loyalty: 6 }), 'g3', { talent: 'heart', loyalty: 6 });
    const h = local(b0);
    const b = setLocal(b0, h.id, 'eze');
    const out = evening(b, [{ holdingId: h.id, method: 'lean', squad: ['g1', 'g2', 'g3'], odds: 0 }]);
    expect(out.district!.holdings.find((y) => y.id === h.id)!.mood).toBe('shut');
    expect(out.crew.find((c) => c.id === 'g1')!.loyalty).toBe(5);
    expect(out.crew.find((c) => c.id === 'g3')!.loyalty).toBe(6);
    expect(out.team.heat).toBe(Math.min(10, b.team.heat + 3));
  });
  it('Heat goes by the day\'s loudest job, not the sum (Lean +2 and Take +3 and a scout: +3)', () => {
    const b0 = { ...found('grey'), team: { ...found('grey').team, heat: 1 } };
    const [a, c] = b0.district!.holdings.filter((h) => h.kind === 'local');
    let b = setLocal(setLocal(b0, a!.id, 'eze'), c!.id, 'zamora');
    b = evening(b, [
      { holdingId: a!.id, method: 'lean', squad: ['g1', 'g2', 'g3'], odds: 100 },
      { holdingId: c!.id, method: 'take', squad: ['g4', 'g5'], thing: 'stock', odds: 100 },
      { holdingId: a!.id, method: 'scout', squad: ['g6'], odds: 100 },
    ]);
    expect(b.team.heat).toBe(4);
    expect(b.evening).toContain("Heat +3: the day's loudest job.");
  });
  it('Take: stock pays three days once and holds nothing; a deed holds (paper); Hands failing leaves no face, anyone else\'s is known', () => {
    const b0 = found('grey');
    const h = local(b0);
    const b = setLocal(b0, h.id, 'eze');
    const stock = evening(b, [{ holdingId: h.id, method: 'take', squad: ['g1', 'g2'], thing: 'stock', odds: 100 }]);
    expect(stock.district!.holdings.find((y) => y.id === h.id)!.owner).toBe('nobody');
    expect(stock.team.dread).toBe(b.team.dread + 2);
    const deed = evening(b, [{ holdingId: h.id, method: 'take', squad: ['g1', 'g2'], thing: 'deed', odds: 100 }]);
    expect(deed.district!.holdings.find((y) => y.id === h.id)).toMatchObject({ owner: 'team', holds: true, method: 'take' });
    const seen = evening(b, [{ holdingId: h.id, method: 'take', squad: ['g1', 'g2'], thing: 'stock', odds: 0 }]);
    expect(seen.crew.find((c) => c.id === 'g1')!.known).toBe(true);
    const hands = evening(person(b, 'g1', { talent: 'hands' }), [{ holdingId: h.id, method: 'take', squad: ['g1', 'g2'], thing: 'stock', odds: 0 }]);
    expect(hands.crew.find((c) => c.id === 'g1')!.known).toBeFalsy();
    expect(hands.team.heat).toBe(Math.max(0, b.team.heat - 1));
  });
  it('a known face at Heat 8+ is arrested at the Evening, and can\'t be sent (Warrants)', () => {
    const b0 = person({ ...toDispatch(found('grey')), team: { ...found('grey').team, heat: 8 } }, 'g1', { known: true });
    expect(jobProblem(b0, { holdingId: local(b0).id, method: 'scout', squad: ['g1'] })).toMatch(/warrant/);
    const out = evening(b0, []);
    expect(out.crew.find((c) => c.id === 'g1')).toMatchObject({ where: 'left', left: { how: 'arrested' } });
    expect(out.log.some((e) => e.kind === 'leave' && e.who.includes('g1'))).toBe(true);
  });
  it('Expose needs something true and proof: refused without; a taken ledger is proof (spent, no Regard); a Warm witness is clean (Regard +1)', () => {
    const b0 = toDispatch(found('grey'));
    const [t, w] = b0.district!.holdings.filter((h) => h.kind === 'local');
    let b = setLocal(b0, t!.id, 'eze', { scouted: 2 });
    expect(jobProblem(b, { holdingId: t!.id, method: 'expose', squad: ['g1', 'g2'] })).toBe(EVIL_DATA.line.proof.nothing);
    b = setLocal(b0, t!.id, 'baumgartner', { scouted: 2 });
    expect(jobProblem(b, { holdingId: t!.id, method: 'expose', squad: ['g1', 'g2'] })).toBe(EVIL_DATA.line.proof.need);
    const ledger = evening(b, [{ holdingId: t!.id, method: 'take', squad: ['g1', 'g2'], thing: 'ledger', odds: 100 }]);
    expect(ledger.proof).toEqual([t!.id]);
    const withProof = { ...ledger, here: { ...ledger.here, day: ledger.here.day + 1, beat: 'dispatch' as const }, crew: ledger.crew.map((c) => ({ ...c, outOn: null })) };
    expect(jobProblem(withProof, { holdingId: t!.id, method: 'expose', squad: ['g1', 'g2'] })).toBeNull();
    const pub = evening(withProof, [{ holdingId: t!.id, method: 'expose', squad: ['g1', 'g2'], odds: 100 }]);
    expect(pub.proof).toEqual([]);
    expect(pub.team.regard).toBe(withProof.team.regard);
    // A witness: a Warm local the team holds on the same street.
    const sameStreet = b0.district!.holdings.find((h) => h.kind === 'local' && h.id !== t!.id && Math.abs(h.step - t!.step) <= 1 && EVIL_DATA.district.streets.findIndex((s) => h.step >= s.from && h.step <= s.to) === EVIL_DATA.district.streets.findIndex((s) => t!.step >= s.from && t!.step <= s.to));
    if (sameStreet) {
      const wb = setLocal(b, sameStreet.id, w!.ref === 'baumgartner' ? 'eze' : w!.ref, { owner: 'team', mood: 'warm', holds: true });
      expect(proofFor(wb, wb.district!.holdings.find((h) => h.id === t!.id)!)?.how).toBe('witness');
      const clean = evening(wb, [{ holdingId: t!.id, method: 'expose', squad: ['g1', 'g2'], odds: 100 }]);
      expect(clean.team.regard).toBe(Math.min(10, wb.team.regard + 1));
      expect(clean.crew.find((c) => c.id === 'g1')!.outOn).toBe(clean.here.day + 1);
    }
  });
  it('Dread 8+: a holding comes over on its own, nearest first, no squad, no Heat; at Dread 7 nothing does (boundary)', () => {
    const b0 = found('grey');
    const at8 = evening({ ...b0, team: { ...b0.team, dread: 8, heat: 3 } }, []);
    const firstLocal = b0.district!.holdings.filter((h) => h.kind === 'local' && h.ref !== 'amadi').sort((a, b) => a.step - b.step)[0]!;
    expect(at8.district!.holdings.find((h) => h.id === firstLocal.id)).toMatchObject({ owner: 'team', method: 'lean', holds: false });
    expect(at8.team.heat).toBe(3);
    const at7 = evening({ ...b0, team: { ...b0.team, dread: 7 } }, []);
    expect(at7.district!.holdings.filter((h) => h.owner === 'team')).toHaveLength(b0.district!.holdings.filter((h) => h.owner === 'team').length);
  });
  it('a district that ends: Heat −3; Dread −1 when nothing in it was Leaned or Taken', () => {
    const b0 = found('grey');
    const last = { ...b0, here: { ...b0.here, day: EVIL_DATA.district.rules.days }, team: { ...b0.team, heat: 6, dread: 4 } };
    const out = evening(last, []);
    expect(out.district!.end).toBeDefined();
    // No job went out that day, so the day itself moves no Heat; the district's end takes 3.
    expect(out.team.heat).toBe(6 - 3);
    expect(out.team.dread).toBe(3);
  });
});

describe('the lamps, the forecast and the words', () => {
  it('the strip: amber to 5, a red rule from 6, the ladder\'s word in the tip; Dread\'s word', () => {
    const b = found('grey');
    const at = (heat: number) => frameModel({ ...b, team: { ...b.team, heat } }, 'Red').strip;
    expect(at(5).rule).toBe(false);
    expect(at(6).rule).toBe(true);
    expect(at(7).heatTip).toContain('Checkpoints');
    expect(heatStep(0).word).toBe('Rumour');
    expect(heatStep(10).word).toBe('Raid');
    expect(frameModel({ ...b, team: { ...b.team, dread: 4 } }, 'Red').strip.dreadTip).toContain('Children called indoors');
  });
  it('Dispatch\'s forecast reads the queue\'s loudest job and the pace', () => {
    const b = { ...toDispatch(found('grey')), team: { ...found('grey').team, heat: 5 } };
    expect(heatForecast(b)).toBe('Heat tonight: 5 → 4 (nothing loud).');
    const h = local(b);
    const q = { ...b, queue: [{ holdingId: h.id, method: 'take' as const, squad: ['g1', 'g2'], thing: 'stock' as const, odds: null, certain: false, terms: [] }] };
    expect(heatForecast(q)).toBe(`Heat tonight: 5 → 8 (Take, step ${h.step}). At this pace: a Raid in 1 day.`);
  });
  it('checkpoints at Heat 7: −20 on every job but a scout, unless Wheels leads', () => {
    const b = toDispatch(found('grey'));
    const h = local(b);
    const hot = { ...b, team: { ...b.team, heat: 7 } };
    const terms = (x: EvilModeBlock) => boardModel(x, { ...newDispatch(), step: 'how', at: h.step - 1, how: 0, squad: ['g1', 'g2'] }).dispatch!.oddsLine;
    expect(terms(hot)).toContain('Checkpoints');
    expect(terms(b)).not.toContain('Checkpoints');
    expect(terms(person(hot, 'g1', { talent: 'wheels' }))).not.toContain('Checkpoints');
  });
});

describe('moving the Line (once a region, at Night)', () => {
  it('only at Night, never to where it is, once a region', () => {
    const b = found('grey');
    expect(step(b, { type: 'moveLine', to: 'whatever' }).ok).toBe(false);
    const n = toNight(b);
    expect(step(n, { type: 'moveLine', to: 'grey' }).ok).toBe(false);
    const moved = go(n, { type: 'moveLine', to: 'whatever' });
    expect(moved.team.line).toBe('whatever');
    expect(moved.log.at(-1)!.kind).toBe('line');
    expect(step(moved, { type: 'moveLine', to: 'grey' }).ok).toBe(false);
  });
  it('darker to Whatever it takes: every Heart is named first and leaves together at breakfast two days on (not before)', () => {
    let b = person(found('grey'), 'g2', { talent: 'heart', name: 'Faye' });
    b = toNight(b);
    expect(linePreview(b, 'whatever').who.map((w) => w.name)).toEqual(['Faye']);
    b = go(b, { type: 'moveLine', to: 'whatever' });
    const day = b.here.day;
    expect(heartsGo({ ...b, here: { ...b.here, day: day + 1 } }).notes).toEqual([]);
    const gone = heartsGo({ ...b, here: { ...b.here, day: day + 2 } });
    expect(gone.block.crew.find((c) => c.id === 'g2')).toMatchObject({ where: 'left', left: { how: 'lineMoved' } });
    expect(heartsGo(gone.block).notes).toEqual([]);
  });
  it('lighter to Clean hands costs the hard cases: Hands under Loyalty 5 leaves, at 5 stays and watches; Lean is refused after', () => {
    let b = person(person(found('grey'), 'g1', { talent: 'hands', loyalty: 4 }), 'g2', { talent: 'hands', loyalty: 5 });
    b = toNight(b);
    const p = linePreview(b, 'clean');
    expect(p.who.map((w) => w.will)).toEqual(['leaves', 'stays, and watches']);
    b = go(b, { type: 'moveLine', to: 'clean' });
    expect(b.crew.find((c) => c.id === 'g1')!.where).toBe('left');
    expect(b.crew.find((c) => c.id === 'g2')!.loyalty).toBe(4);
    b = go(go(b, { type: 'lightsOut' }), { type: 'watchRoad' });
    b = toDispatch(b);
    expect(jobProblem(b, { holdingId: local(b).id, method: 'lean', squad: ['g3', 'g4', 'g5'] })).toBe('Not on a Clean hands team.');
  });
  it('the Line page shows the three stops, the current one, and why a move can\'t happen now', () => {
    const b = found('grey');
    const m = lineModel(b, 2);
    expect(m.stops.map((s) => s.current)).toEqual([false, true, false]);
    expect(m.problem).toBe(EVIL_DATA.line.move.notNight);
    expect(lineModel(toNight(b), 2).problem).toBeNull();
  });
});

describe('the team\'s real Line and three more ways to leave', () => {
  it('a Roster whose lines cover every Lean: "This team doesn\'t frighten people."', () => {
    const b = { ...found('grey'), crew: firstCrew(4, 6).map((c) => ({ ...c, line: 13 })) };
    expect(realLine(b)).toContain("This team doesn't frighten people. Whatever the Line says.");
    expect(realLine(found('grey'))).toEqual([]);
    const hearts = { ...found('grey'), crew: found('grey').crew.map((c, i) => (i === 0 ? { ...c, talent: 'heart' as const, where: 'left' as const } : c)) };
    expect(realLine(hearts)).toContain("There's nobody here now who'd stop.");
  });
  it('with the Hero: a beaten person under Loyalty 5 goes at one in three (Doubts or Kind two in three); at 5 nothing is drawn', () => {
    const b = found('grey');
    expect(goWithHero(person(b, 'g1', { loyalty: 5 }), 'g1').block.draws['evil-line'] ?? 0).toBe(0);
    let left = 0;
    let kindLeft = 0;
    for (let n = 0; n < 60; n++) {
      const x = { ...person(b, 'g1', { loyalty: 3 }), draws: { ...b.draws, 'evil-line': n } };
      const r = goWithHero(x, 'g1');
      expect(r.block.draws['evil-line']).toBe(n + 1);
      if (r.line) { left += 1; expect(r.block.crew.find((c) => c.id === 'g1')!.left?.how).toBe('hero'); }
      if (goWithHero(person(x, 'g1', { flaw: 'kind' }), 'g1').line) kindLeft += 1;
    }
    expect(left).toBeGreaterThan(5);
    expect(left).toBeLessThan(40);
    expect(kindLeft).toBeGreaterThan(left);
  });
});

describe('saves: block v6', () => {
  it('v5 -> v6: no proof, the Line never moved; save and reload the same', () => {
    const b = found('grey');
    const { proof: _p, lineMove: _l, ...rest } = b;
    const v6 = EvilModeBlockSchema.parse({ ...rest, v: 5 });
    expect(v6).toMatchObject({ v: 17, proof: [], lineMove: null });
    expect(EvilModeBlockSchema.parse(JSON.parse(JSON.stringify(v6)))).toEqual(v6);
  });
  it('a damaged Take (an unknown thing) and a damaged Line move are refused', () => {
    const b = found('grey');
    const h = local(b);
    expect(EvilModeBlockSchema.safeParse({ ...b, queue: [{ holdingId: h.id, method: 'take', squad: ['g1', 'g2'], thing: 'a Pokémon', odds: null, certain: false, terms: [] }] }).success).toBe(false);
    expect(EvilModeBlockSchema.safeParse({ ...b, lineMove: { day: 1, region: 0, from: 'grey', to: 'shadow' } }).success).toBe(false);
  });
  it('a moved Line and proof held survive a save mid-district', () => {
    let b = toNight(found('grey'));
    b = go(b, { type: 'moveLine', to: 'whatever' });
    b = { ...b, proof: [local(b).id] };
    expect(EvilModeBlockSchema.parse(JSON.parse(JSON.stringify(b)))).toEqual(b);
  });
});

describe('standing test 13: Clean hands can win the district', () => {
  it('a Clean hands team that only asks, buys fairly and wins fair fights holds eleven before the seventh day ends', () => {
    let b = found('clean', 'clean13', 8);
    b = { ...b, team: { ...b.team, funds: 20000 } };
    b = toDispatch(b);
    for (let day = 0; day < 7 && !b.district!.end; day++) {
      const free = b.crew.filter((c) => c.where === 'in' && c.outOn !== b.here.day).map((c) => c.id);
      const open = b.district!.holdings.filter((h) => h.owner !== 'team' && h.kind !== 'town' && h.kind !== 'gym' && h.kind !== 'opportunity' && h.ref !== 'amadi');
      for (const h of open) {
        if (free.length < 2) break;
        const job = h.kind === 'wild' || h.kind === 'alpha' ? { holdingId: h.id, method: 'outplay' as const, squad: free.slice(0, 2) }
          : jobProblem(b, { holdingId: h.id, method: 'pay', squad: free.slice(0, 2), offer: 100 }) === null ? { holdingId: h.id, method: 'pay' as const, squad: free.slice(0, 2), offer: 100 }
          : { holdingId: h.id, method: 'persuade' as const, squad: free.slice(0, 2) };
        if (jobProblem(b, job)) continue;
        b = go(b, { type: 'queueJob', job });
        free.splice(0, 2);
      }
      for (const t of ['send', 'stayIn', 'callItADay', 'lightsOut', 'watchRoad', 'dismissOvernight'] as const) {
        if (b.district!.end) break;
        b = go(b, { type: t });
      }
    }
    expect(b.district!.end?.how).toBe('held');
    expect(b.log.some((e) => e.method === 'lean' || e.method === 'take')).toBe(false);
  });
});
