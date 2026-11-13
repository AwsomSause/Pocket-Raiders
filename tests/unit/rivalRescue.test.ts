// Beta 0.6 R9: the Rival Rescue Plan (receipts, holding clock, five plans, complications, reunion).
import { describe, expect, it } from 'vitest';
import { ExpansionRunSchema } from '../../src/core/expansion/schema';
import {
  ARCHETYPES, BEATS, RESCUE, abandonPlan, acceptOffer, activeEffects, answerBeat, answerComplication, climaxBegins, climaxDefeat, climaxVictory, declineOffer, dealPrice,
  drawComplication, exchangeLine, finishPlan, holdState, impound, offerDue, planDueAt, planOptions, preferredPlan, readinessLabel, receiptText, rescueOf, resolvePound,
  returnedElsewhere, rivalLine, shortcutAvailable, stayOut, successChance, tickWarrant, useShortcut, waitFor, type RescueCtx, type SuccessInput,
} from '../../src/core/evil/rescue';
import { chooseStarter, createRun } from '../../src/core/run';
import { content } from './helpers';

const mk = (seed = 'rr1') => {
  const r = chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red' }), 0);
  const base = r.party[0]!;
  r.party = Array.from({ length: 5 }, (_, i) => ({ ...structuredClone(base), uid: `m${i}` }));
  r.money = 1000;
  return r;
};
const ctx = (o: Partial<RescueCtx> = {}): RescueCtx => ({ archetype: 'prodigy', money: 1000, intel: 0, os: 0, insider: false, tradeItem: false, ...o });
const uidsOf = (r: ReturnType<typeof mk>) => [...r.party, ...r.box].map((p) => p.uid).sort();
const hold = (r: ReturnType<typeof mk>, o: { team?: string; count?: number; node?: number; last?: number } = {}) => impound(r, { teamId: o.team ?? 'rocket', regionId: 'kanto', node: o.node ?? 10, lastQuietNode: o.last ?? 60, count: o.count ?? 2 })!;

describe('data', () => {
  it('every archetype has all 22 stages, none empty, plus beaten-to-it and froze', () => {
    for (const a of ARCHETYPES) {
      for (const st of RESCUE.stages) expect(RESCUE.lines[a][st]?.length, `${a}/${st}`).toBeGreaterThan(0);
      expect(RESCUE.beatenToIt[a].length).toBeGreaterThan(0);
      expect(RESCUE.froze[a].length).toBeGreaterThan(0);
    }
  });
  it('14 teams: a receipt each (Snag\'em says none is left), a site, an effect row, 12 complications', () => {
    expect(RESCUE.teams).toHaveLength(14);
    for (const t of RESCUE.teams) {
      expect(RESCUE.receipts[t]).toBeTruthy();
      expect(RESCUE.sites.find((s) => s.team === t)).toBeTruthy();
      expect(RESCUE.effects[t]).toBeTruthy();
    }
    const r = mk();
    expect(receiptText(hold(r, { team: 'snagem' }))).toBeNull();
    expect(receiptText(hold(mk('rr2'), { team: 'aqua' }))).toContain('cargo tag');
    expect(RESCUE.complications.map((c) => c.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });
  it('cellmate pools name real species', () => {
    for (const pool of Object.values(RESCUE.gruntPools)) for (const s of pool) expect(content.species.get(s), s).toBeDefined();
  });
  it('lines fill their tags', () => {
    expect(rivalLine('friendly', 'offer', { count: 2, mon: 'Pikachu', site: 'X' })).toContain('Pikachu');
    expect(rivalLine('hotshot', 'approach', { player: 'Kice' })).toContain('Kice');
  });
});

describe('impound and the holding clock', () => {
  it('takes bench first and never the last two party members', () => {
    const r = mk();
    const h = hold(r, { count: 3 });
    expect(h.pokemon.map((p) => p.uid)).toEqual(['m2', 'm3', 'm4']);
    expect(r.party.map((p) => p.uid)).toEqual(['m0', 'm1']);
    expect(impound(r, { teamId: 'rocket', regionId: 'johto', node: 12, lastQuietNode: 60, count: 1 })).toBeNull();
  });
  it('the wait is 9-11 nodes, the same on replay, and capped by the last quiet node', () => {
    for (const s of ['a', 'b', 'c', 'd', 'e', 'f', 'g']) {
      const w = waitFor(mk(s), 'kanto');
      expect(w).toBeGreaterThanOrEqual(9);
      expect(w).toBeLessThanOrEqual(11);
      expect(waitFor(mk(s), 'kanto')).toBe(w);
    }
    expect(planDueAt(10, 11, 15)).toBe(15);
    expect(planDueAt(10, 9, 60)).toBe(19);
  });
  it('a later impound in the same region joins before the offer; after it a new hold starts', () => {
    const r = mk();
    const a = hold(r, { count: 1 });
    const b = hold(r, { count: 1 });
    expect(b.id).toBe(a.id);
    expect(a.pokemon).toHaveLength(2);
    a.offers = 1;
    r.party.push({ ...structuredClone(r.party[0]!), uid: 'x1' }, { ...structuredClone(r.party[0]!), uid: 'x2' });
    expect(hold(r, { count: 1 }).id).not.toBe(a.id);
  });
  it('clock reads logged, processed, assigned by nodes held; held-too-long only by the base rule; it stops on accept', () => {
    const r = mk();
    const h = hold(r);
    expect(holdState(h, 10)).toBe('logged');
    expect(holdState(h, 14)).toBe('logged');
    expect(holdState(h, 15)).toBe('processed');
    expect(holdState(h, 19)).toBe('processed');
    expect(holdState(h, 20)).toBe('assigned');
    h.frozenAt = 16;
    expect(holdState(h, 99)).toBe('processed');
    h.declines = 2;
    expect(holdState(h, 10)).toBe('held-too-long');
  });
});

describe('offers', () => {
  it('first offer at dueAt, only at a quiet node, never during a plan; second after a decline; no third', () => {
    const r = mk();
    const h = hold(r);
    expect(offerDue(r, h.dueAt - 1, true)).toBeNull();
    expect(offerDue(r, h.dueAt, false)).toBeNull();
    expect(offerDue(r, h.dueAt, true)).toEqual({ holdId: h.id, kind: 'first' });
    declineOffer(r, h.id, h.dueAt, 'hotshot');
    expect(offerDue(r, h.dueAt + 4, true)).toBeNull();
    expect(offerDue(r, h.dueAt + 5, true)?.kind).toBe('second');
    declineOffer(r, h.id, h.dueAt + 5, 'hotshot');
    expect(offerDue(r, h.dueAt + 30, true)).toBeNull();
    expect(h.declines).toBe(2);
    expect(holdState(h, 99)).toBe('held-too-long');
  });
  it('the offer is climax-eve at the last quiet node, and a second offer comes then even before 5 nodes', () => {
    const r = mk();
    const h = hold(r, { last: 14 });
    expect(h.dueAt).toBe(14);
    expect(offerDue(r, 14, true)?.kind).toBe('climax-eve');
  });
  it('a stay-out makes the Late Plan guaranteed, and it costs 0.10', () => {
    const r = mk();
    const h = hold(r);
    stayOut(r, h.id);
    expect(offerDue(r, 1, true)).toEqual({ holdId: h.id, kind: 'late' });
    const pr = acceptOffer(r, h.id, 'quiet', ctx(), 2);
    expect(pr.late).toBe(true);
  });
  it('quitting mid-plan brings the offer back at the next quiet node as the first offer', () => {
    const r = mk();
    const h = hold(r);
    acceptOffer(r, h.id, 'quiet', ctx(), 20);
    abandonPlan(r, 21);
    expect(rescueOf(r).active).toBeNull();
    expect(offerDue(r, 21, true)?.holdId).toBe(h.id);
  });
});

describe('plans and probability', () => {
  const base: SuccessInput = { plan: 'quiet', attitude: 0, intel: 0, os: 0, preferred: false, beatPoints: 0, raidTriumph: false, raidFailure: false, late: false };
  it('uses the base values and the clamp 0.35-0.95 for every input', () => {
    expect(successChance(base)).toBeCloseTo(0.7);
    expect(successChance({ ...base, plan: 'loud' })).toBeCloseTo(0.8);
    expect(successChance({ ...base, plan: 'inside' })).toBeCloseTo(0.85);
    expect(successChance({ ...base, attitude: 5, intel: 100, preferred: true, beatPoints: 3, raidTriumph: true, plan: 'inside', insiderGood: true })).toBe(0.95);
    expect(successChance({ ...base, attitude: -5, os: 60, beatPoints: -3, raidFailure: true, late: true, penalty: 0.1 })).toBe(0.35);
    for (const att of [-9, -5, 0, 5, 9]) for (const os of [0, 10, 90]) for (const b of [-4, 0, 4]) for (const plan of ['quiet', 'loud', 'inside'] as const) {
      const p = successChance({ ...base, plan, attitude: att, os, beatPoints: b });
      expect(p).toBeGreaterThanOrEqual(0.35);
      expect(p).toBeLessThanOrEqual(0.95);
    }
  });
  it('terms move the way the design says', () => {
    expect(successChance({ ...base, preferred: true })).toBeCloseTo(0.8);
    expect(successChance({ ...base, intel: 50 })).toBeCloseTo(0.76);
    expect(successChance({ ...base, os: 15 })).toBeCloseTo(0.6);
    expect(successChance({ ...base, late: true })).toBeCloseTo(0.6);
  });
  it('the readiness label is a word, never a number', () => {
    expect(readinessLabel(0.4)).toBe('Risky');
    expect(readinessLabel(0.55)).toBe('Even');
    expect(readinessLabel(0.7)).toBe('Likely');
    expect(readinessLabel(0.9)).toBe('Safe');
    expect(readinessLabel(0.7)).not.toMatch(/\d/);
  });
  it('preferred plan by archetype, with the two shifts', () => {
    expect(preferredPlan(ctx({ archetype: 'hotshot' }))).toBe('loud');
    expect(preferredPlan(ctx({ archetype: 'heir' }))).toBe('deal');
    expect(preferredPlan(ctx({ archetype: 'scholar' }))).toBe('quiet');
    expect(preferredPlan(ctx({ archetype: 'scholar', defector: true }))).toBe('inside');
    expect(preferredPlan(ctx({ archetype: 'bitter', tradeItem: true, tradeItemFromTeam: true }))).toBe('exchange');
    expect(preferredPlan(ctx({ archetype: 'mirror', mirrorApproach: 'loud' }))).toBe('loud');
  });
  it('Inside Job and Exchange appear only when earned; Side-with always lists the Inside Job; Deal is greyed with no money', () => {
    const o = (c: RescueCtx) => Object.fromEntries(planOptions(c).map((x) => [x.plan, x.available]));
    expect(o(ctx())).toEqual({ quiet: true, loud: true, deal: true, inside: false, exchange: false });
    expect(o(ctx({ insider: true, tradeItem: true }))).toMatchObject({ inside: true, exchange: true });
    expect(o(ctx({ sideWith: true })).inside).toBe(true);
    const broke = planOptions(ctx({ money: 0 })).find((x) => x.plan === 'deal')!;
    expect(broke.available).toBe(false);
    expect(broke.reason).toBeTruthy();
  });
  it('the Inside Job has two beats and no Door; the others three', () => {
    expect(BEATS.inside).toEqual(['approach', 'cage']);
    expect(BEATS.quiet).toContain('door');
  });
  it('exactly one complication per plan, deterministic', () => {
    const r = mk();
    const h = hold(r);
    const c = drawComplication(r, 'kanto');
    expect(c).toBeGreaterThanOrEqual(1);
    expect(c).toBeLessThanOrEqual(12);
    expect(acceptOffer(r, h.id, 'quiet', ctx(), 20).complication).toBe(c);
    expect(drawComplication(mk(), 'kanto')).toBe(c);
  });
});

describe('results keep the party legal', () => {
  const run = (plan: 'quiet' | 'loud', seedBase: string, wiped = false, beats: ('good' | 'neutral' | 'bad')[] = ['neutral', 'neutral', 'neutral'], team = 'rocket') => {
    const r = mk(seedBase);
    const h = hold(r, { count: 3, team });
    acceptOffer(r, h.id, plan, ctx(), 25);
    for (const b of beats) answerBeat(r, b);
    answerComplication(r, 'good');
    const before = uidsOf(r);
    const out = finishPlan(r, ctx(), 25, { wiped });
    return { r, h, out, before };
  };
  it('every result keeps every Pokémon exactly once (none duplicated or lost)', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 40; i++) {
      const { r, h, out } = run(i % 2 ? 'loud' : 'quiet', `s${i}`, i % 7 === 0);
      seen.add(out.result);
      expect(uidsOf(r).concat(h.pokemon.map((p) => String(p.uid))).sort()).toEqual(['m0', 'm1', 'm2', 'm3', 'm4']);
      expect(r.party.length).toBeLessThanOrEqual(6);
      if (out.result === 'full') expect(h.pokemon).toHaveLength(0);
      if (out.result === 'fail') expect(h.pokemon).toHaveLength(3);
      if (out.result === 'partial') expect(h.pokemon.length).toBeGreaterThan(0), expect(h.pokemon.length).toBeLessThan(3);
    }
    expect(seen.has('full')).toBe(true);
  });
  it('a wipe is only a Fail and the second offer is still due', () => {
    const { r, h, out } = run('quiet', 'wipe', true);
    expect(out.result).toBe('fail');
    expect(rescueOf(r).active).toBeNull();
    expect(h.lastDeclineNode).not.toBeNull();
    expect(offerDue(r, 30, true)?.kind).toBe('second');
  });
  it('same seed and choices roll the same result', () => {
    const a = run('loud', 'same');
    const b = run('loud', 'same');
    expect(a.out.result).toBe(b.out.result);
    expect(a.out.cellmate).toEqual(b.out.cellmate);
  });
  it('heat: Loud Grab always +15; Loud Full costs 1 Operational Strength', () => {
    for (let i = 0; i < 20; i++) {
      const { out } = run('loud', `h${i}`);
      expect(out.heatDelta).toBeGreaterThanOrEqual(15);
      if (out.result === 'full') expect(out.osDelta).toBe(-1);
    }
  });
  it('Team Yell cannot fail', () => {
    for (let i = 0; i < 10; i++) expect(run('quiet', `y${i}`, false, ['bad', 'bad', 'bad'], 'yell').out.result).toBe('full');
  });
  it('Full gives memory and attitude by archetype; the returned carry a clock state and a five-node effect', () => {
    for (let i = 0; i < 40; i++) {
      const { r, out } = run('loud', `f${i}`, false, ['good', 'good', 'good']);
      if (out.result !== 'full') continue;
      const s = rescueOf(r);
      expect(s.memory).toContain('rescue-together');
      expect(s.attitude).toBeGreaterThan(0);
      expect(s.returned).toHaveLength(3);
      expect(activeEffects(r, 26)[0]!.summary).toBeTruthy();
      expect(activeEffects(r, 25 + 6)).toHaveLength(0);
      return;
    }
    throw new Error('no Full in 40 seeds');
  });
});

describe('The Deal and The Exchange', () => {
  it('the Deal takes 40% (30% with reputation), Intel -5 takes 10 off, never below zero, and always succeeds', () => {
    expect(dealPrice(1000, { intel: 0 }, false).money).toBe(400);
    expect(dealPrice(1000, { intel: 0, teamRep: 15 }, false).money).toBe(300);
    expect(dealPrice(1000, { intel: 20 }, true)).toEqual({ money: 300, intel: 5 });
    const r = mk();
    const h = hold(r);
    acceptOffer(r, h.id, 'deal', ctx(), 12);
    const out = finishPlan(r, ctx(), 12);
    expect(out.result).toBe('deal');
    expect(out.moneySpent).toBe(400);
    expect(r.money).toBe(600);
    expect(out.intelDelta).toBe(-5);
    expect(h.pokemon).toHaveLength(0);
  });
  it('the Deal is refused with no money; an Heir\'s rival pays', () => {
    const r = mk();
    r.money = 0;
    const h = hold(r);
    expect(() => acceptOffer(r, h.id, 'deal', ctx({ money: 0 }), 12)).toThrow();
    const r2 = mk('heir');
    const h2 = hold(r2);
    acceptOffer(r2, h2.id, 'deal', ctx({ archetype: 'heir' }), 12);
    expect(finishPlan(r2, ctx({ archetype: 'heir' }), 12).moneySpent).toBe(0);
    expect(r2.money).toBe(1000);
  });
  it('one wrong Exchange line is forgiven; two make a Loud Grab at -0.10', () => {
    const r = mk();
    const h = hold(r);
    acceptOffer(r, h.id, 'exchange', ctx({ tradeItem: true }), 12);
    expect(exchangeLine(r, true)).toEqual({ done: false, fallback: false });
    expect(exchangeLine(r, false).done).toBe(false);
    expect(exchangeLine(r, false)).toEqual({ done: true, fallback: false });
    const r2 = mk('ex2');
    const h2 = hold(r2);
    acceptOffer(r2, h2.id, 'exchange', ctx({ tradeItem: true }), 12);
    exchangeLine(r2, true);
    expect(exchangeLine(r2, true)).toEqual({ done: false, fallback: true });
    expect(rescueOf(r2).active).toMatchObject({ plan: 'loud', penalty: 0.1 });
  });
});

describe('shortcuts, climax and the Pound', () => {
  it('the Balloon works once and counts as Full; the Warrant is refused for Snag\'em and Yell and arrives after 3 nodes', () => {
    const r = mk();
    const h = hold(r);
    const out = useShortcut(r, h.id, 'trio', 15, { trioRep: 15 }, 'hotshot');
    expect(out.uids).toHaveLength(2);
    expect(out.line).toContain('balloon');
    expect(rescueOf(r).memory).toContain('rescue-beaten-to-it');
    expect(rescueOf(r).attitude).toBe(0);
    r.party.push({ ...structuredClone(r.party[0]!), uid: 'z1' }, { ...structuredClone(r.party[0]!), uid: 'z2' });
    const h2 = impound(r, { teamId: 'rocket', regionId: 'johto', node: 20, lastQuietNode: 80, count: 1 })!;
    expect(shortcutAvailable(r, h2, 'trio', { trioRep: 99 }).ok).toBe(false);
    for (const t of ['snagem', 'yell']) expect(shortcutAvailable(r, { ...h2, teamId: t }, 'looker', { lookerEvidence: true }).ok).toBe(false);
    expect(useShortcut(r, h2.id, 'looker', 30, { lookerEvidence: true }, 'prodigy').pending).toBe(true);
    expect(tickWarrant(r, 32)).toHaveLength(0);
    expect(tickWarrant(r, 33)).toHaveLength(1);
  });
  it('Wes takes back only Shadow Pokémon', () => {
    const r = mk();
    const h = hold(r, { team: 'snagem', count: 2 });
    const out = useShortcut(r, h.id, 'wes', 40, { wesHere: true, shadowUids: ['m4'] }, 'lone-wolf');
    expect(out.uids).toEqual(['m4']);
    expect(h.pokemon).toHaveLength(1);
  });
  it('climax victory returns everything; Veiled only when held too long and the team binds', () => {
    const r = mk();
    hold(r, { count: 2 });
    climaxBegins(r, { extendedCut: false, climaxEligible: true });
    const v = climaxVictory(r, 70);
    expect(v.uids).toHaveLength(2);
    expect(v.veiled).toHaveLength(2);
    const r2 = mk('yv');
    hold(r2, { team: 'yell', count: 2 });
    climaxBegins(r2, { extendedCut: false, climaxEligible: true });
    expect(climaxVictory(r2, 70).veiled).toHaveLength(0);
    const r3 = mk('ok');
    hold(r3);
    expect(climaxVictory(r3, 20).veiled).toHaveLength(0);
    expect(uidsOf(r3)).toHaveLength(5);
  });
  it('the Pound appears only in the Extended Cut, only if eligible and only if Pokémon are still held; Held returns at 50% HP; Lost loses nothing', () => {
    expect(climaxBegins(mk(), { extendedCut: true, climaxEligible: true })).toBe(false);
    const a = mk('pa');
    hold(a);
    expect(climaxBegins(a, { extendedCut: false, climaxEligible: true })).toBe(false);
    const b = mk('pb');
    hold(b);
    expect(climaxBegins(b, { extendedCut: true, climaxEligible: false })).toBe(false);
    const c = mk('pc');
    hold(c);
    expect(climaxBegins(c, { extendedCut: true, climaxEligible: true })).toBe(true);
    expect(resolvePound(c, false, 60, () => 100)).toEqual([]);
    expect(activeHoldCount(c)).toBe(2);
    const uids = resolvePound(c, true, 60, () => 100);
    expect(uids).toHaveLength(2);
    expect([...c.party, ...c.box].filter((p) => uids.includes(p.uid)).every((p) => p.hp === 50)).toBe(true);
    expect(rescueOf(c).memory).toContain('rescue-pound');
  });
  it('a lost climax records the impounded as lost and returns nothing', () => {
    const r = mk();
    const h = hold(r);
    expect(climaxDefeat(r)).toEqual([`lost-with-impounded:${h.id}`]);
    expect(h.pokemon).toHaveLength(2);
  });
  it('a rescue another way cancels the plan: no offer', () => {
    const r = mk();
    const h = hold(r);
    returnedElsewhere(r, h.id, 12, 'raid3');
    expect(offerDue(r, 99, true)).toBeNull();
    expect(uidsOf(r)).toHaveLength(5);
  });
});

describe('save', () => {
  it('the state round-trips through the expansion block with no version bump', () => {
    const r = mk();
    const h = hold(r);
    acceptOffer(r, h.id, 'loud', ctx(), 20);
    const block = ExpansionRunSchema.parse(JSON.parse(JSON.stringify(r.expansion)));
    expect(block.rescue?.holds[0]?.pokemon).toHaveLength(2);
    expect(block.rescue?.active?.plan).toBe('loud');
    expect(ExpansionRunSchema.parse({}).rescue).toBeUndefined();
  });
});

const activeHoldCount = (r: ReturnType<typeof mk>) => rescueOf(r).holds.reduce((n, h) => n + h.pokemon.length, 0);

describe('screen view-models', () => {
  const names = { player: 'Kice', mon: 'Pikachu' };
  it('the offer view lists five plans, words not numbers, the receipt and the clock', async () => {
    const { offerView, nextBeatView, exchangeView, resultView } = await import('../../src/core/evil/rescueView');
    const r = mk();
    const h = hold(r);
    const v = offerView(r, { holdId: h.id, kind: 'first' }, ctx({ archetype: 'hotshot' }), h.impoundNode + 1, names);
    expect(v.plans.map((p) => p.plan)).toEqual(['quiet', 'loud', 'deal', 'inside', 'exchange']);
    expect(v.plans.find((p) => p.plan === 'loud')!.preferred).toBe(true);
    for (const p of v.plans) if (p.readiness) expect(['Risky', 'Even', 'Likely', 'Safe']).toContain(p.readiness);
    expect(v.plans.find((p) => p.plan === 'deal')!.readiness).toBeNull();
    expect(v.plans.find((p) => p.plan === 'inside')!.available).toBe(false);
    expect(v.receipt).toContain('claim ticket');
    expect(v.clock.state).toBe('logged');
    expect(v.lines.join(' ')).toContain('Kice');
    expect(JSON.stringify(v.plans.map((p) => p.readiness))).not.toMatch(/\d/);
    // beats: three, then the complication, then done; the order is stable per run
    acceptOffer(r, h.id, 'quiet', ctx(), h.dueAt);
    const seq: string[] = [];
    for (let i = 0; i < 4; i++) {
      const b = nextBeatView(r, ctx())!;
      expect(b.choices).toHaveLength(i < 3 ? 3 : 2);
      expect(b).toEqual(nextBeatView(r, ctx()));
      seq.push(b.kind);
      if (b.kind === 'beat') answerBeat(r, 'good');
      else answerComplication(r, 'good');
    }
    expect(seq).toEqual(['beat', 'beat', 'beat', 'complication']);
    expect(nextBeatView(r, ctx())).toBeNull();
    const out = finishPlan(r, ctx(), h.dueAt);
    expect(resultView(out, 'prodigy', { ...names, site: 'x' }).lines.every((l) => l.length > 0)).toBe(true);
    expect(exchangeView(r, 0).choices.map((c) => c.wrong).sort()).toEqual([false, true]);
  });
});
