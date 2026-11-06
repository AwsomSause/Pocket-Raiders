// Story Overhaul W2: coverage fairness budget (14.5), ace ladders (14.6), the 14 adaptation triggers (14.7).
import { describe, expect, it } from 'vitest';
import { content } from './helpers';
import type { TrainerPlan } from '../../src/core/encounters';
import { ACES, ladderFamily, rowStatus, withAceLadder } from '../../src/core/rivals/aces';
import { ADAPT, firedTriggers, longestSweep, recordSightings, rivalAdaptation, sightings, triggerFires } from '../../src/core/rivals/adaptTriggers';
import { acePhase, budgetProblems, COVERAGE, CoverageSetSchema, setStatus, teamCoverageMax, withCoverage } from '../../src/core/rivals/coverage';
import { chooseStarter, createRun } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import type { Rival } from '../../src/core/story/schema';

const newRun = (seed: string, region = 0): RunState => {
  const run = structuredClone(chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red' }), 0));
  run.regionIndex = region;
  return run;
};
const rival = (over: Partial<Rival> = {}): Rival =>
  ({
    id: 'r1', name: 'Blue', canon: 'Blue', major: true, classId: 'youngster', archetype: 'x', style: 'y', rivalPotential: 10, state: 'active', encounters: 3, setbacks: 0, away: 0, cooldown: 0, progress: 0, bonds: {}, offscreen: [], adaptations: [],
    arc: null, origin: { eventId: 'e', where: { region: 0, stage: 1, turn: 0 }, path: 'p' },
    traits: { empathy: 50, vindictiveness: 30, resilience: 50, pride: 40, ambition: 50, adaptability: 90 },
    memory: { lastBattle: { eventId: 'e', result: 'lose', hpLeftShare: 0.5, turns: 6, team: ['pidgey'] } },
    ...over,
  }) as unknown as Rival;
const plan = (ids: string[], level = 40): TrainerPlan => ({ classId: 'youngster', name: 'x', leaderId: null, ai: 0.5, members: ids.map((speciesId) => ({ speciesId, level })), levelInfo: ids.map(() => ({ level }) as never) });
const seen = (signal: string, value: string, at: string, uses = 1) => ({ signal, value, source: 'fought', at, uses }) as NonNullable<Rival['seen']>[number];

describe('W2 coverage fairness budget (14.5)', () => {
  it('all 20 example sets pass the budget and none is disabled', () => {
    expect(COVERAGE.sets).toHaveLength(20);
    for (const s of COVERAGE.sets) {
      expect(budgetProblems(content, s)).toEqual([]);
      expect(setStatus(content, s).status).not.toBe('disabled');
    }
    expect(new Set(COVERAGE.sets.map((s) => s.id)).size).toBe(20);
  });

  it('rejects broken sets: learn none without signature, both top weaknesses covered, too many moves, sash + wide move', () => {
    const base = COVERAGE.sets.find((s) => s.species === 'dragonite')!;
    expect(CoverageSetSchema.safeParse({ ...base, coverage: [{ ...base.coverage[0], learn: 'none' }] }).success).toBe(false);
    // Dragonite: top weaknesses ice, rock. A rock + ice answer covers both.
    const both = { ...base, coverage: [{ move: 'earthquake', answers: ['rock'], learn: 'tm' as const }, { move: 'iron-head', answers: ['ice'], learn: 'tm' as const }] };
    expect(budgetProblems(content, both).join(' ')).toMatch(/both top weaknesses/);
    const early = { ...base, minPhase: 'early' as const, coverage: [base.coverage[0]!, { move: 'fire-punch', answers: ['steel'], learn: 'tm' as const }] };
    expect(budgetProblems(content, early).join(' ')).toMatch(/budget 1 in early/);
    expect(budgetProblems(content, base, 'focus-sash').join(' ')).toMatch(/Focus Sash/);
  });

  it('phase gate: a counter set needs its types seen in 3 battles; an unexpected set never answers your top type', () => {
    const run = newRun('w2cov', 3); // mid
    expect(acePhase(content, run)).toBe('mid');
    const r = rival({ ace: 'cyndaquil' });
    const p = plan(['rattata', 'typhlosion']);
    expect(withCoverage(content, run, r, p, false).setId).toBeNull();
    r.seen = ['a', 'b', 'c'].map((at) => seen('moveType', 'water', at, 2));
    const got = withCoverage(content, run, r, p, false);
    expect(got.setId).toBe('cv_typhlosion_thunder_punch');
    expect(got.plan.members[1]!.moves).toContain('thunder-punch');
    expect(got.note).toContain('Thunder Punch');
    expect(withCoverage(content, run, r, p, false, 0).setId).toBeNull(); // no team budget left
    // Unexpected coverage: Swellow's Heat Wave answers grass/ice/bug/steel and is the unannounced surprise.
    const s = rival({ ace: 'taillow', seen: [seen('moveType', 'water', 'a')] });
    const sw = withCoverage(content, run, s, plan(['rattata', 'swellow']), false);
    expect(sw).toMatchObject({ setId: 'cv_swellow_heat_wave', surprise: true, note: null });
    s.seen = [seen('moveType', 'grass', 'a', 5)];
    expect(withCoverage(content, run, s, plan(['rattata', 'swellow']), false).setId).toBeNull();
    // Never in the same meeting as an adaptation.
    s.seen = [seen('moveType', 'water', 'a')];
    expect(withCoverage(content, run, s, plan(['rattata', 'swellow']), true).setId).toBeNull();
    expect(teamCoverageMax(content, newRun('w2c', 9))).toBe(4);
  });
});

describe('W2 ace ladders (14.6)', () => {
  it('every ladder has four phases, one change each, on one Pokémon line', () => {
    const rivals = [...new Set(ACES.ladders.map((r) => r.rival))];
    expect(rivals).toHaveLength(17);
    for (const name of rivals) expect(ACES.ladders.filter((r) => r.rival === name).map((r) => r.phase)).toEqual(['early', 'mid', 'late', 'champion']);
    for (const row of ACES.ladders) expect(rowStatus(content, row).status, `${row.rival} ${row.phase}: ${rowStatus(content, row).why}`).not.toBe('disabled');
  });

  it('sets the ace line and applies the phase step without raising levels', () => {
    const r = rival({ ace: ladderFamily(content, { name: 'Blue', canon: 'Blue' })! });
    expect(r.ace).toBe('pidgey');
    const mid = withAceLadder(content, newRun('w2l', 2), r, plan(['rattata', 'charmeleon'], 30));
    expect(mid.plan.members[1]).toMatchObject({ speciesId: 'pidgeot', level: 30 });
    expect(mid.plan.members[1]!.moves).toContain('heat-wave');
    expect(mid.note).toContain("Blue's Pidgeot");
    const silver = rival({ name: 'Silver', canon: 'Silver', ace: 'sneasel' });
    const late = withAceLadder(content, newRun('w2s', 6), silver, plan(['zubat', 'sneasel'], 50));
    expect(late.plan.members[1]).toMatchObject({ speciesId: 'weavile', held: { 'focus-sash': 1 } });
    // A rival whose ace is another line (an older save) keeps its team.
    expect(withAceLadder(content, newRun('w2o', 2), rival({ ace: 'charmander' }), plan(['rattata', 'charmeleon'])).note).toBeNull();
  });
});

describe('W2 adaptation triggers (14.7)', () => {
  it('records only what the rival watched in one battle', () => {
    const s = sightings(content, { moves: { 'swords-dance': 2, 'quick-attack': 3, 'thunder-wave': 1, recover: 1, 'rain-dance': 1, 'stealth-rock': 1, 'u-turn': 2, tackle: 4 }, switches: 5, gimmicks: ['mega'], lead: 'pikachu', sweep: 3, legends: ['mewtwo'] });
    const by = Object.fromEntries(s.map((e) => [`${e.signal}${e.value ? `:${e.value}` : ''}`, e.uses]));
    expect(by).toMatchObject({ setup: 2, priority: 3, status: 1, recovery: 1, 'weather:rain': 1, hazards: 1, pivot: 2, switches: 5, 'gimmick:mega': 1, 'lead:pikachu': 1, sweep: 1, 'legend:mewtwo': 1 });
    const r = rival();
    recordSightings(content, r, { moves: {}, switches: 0, gimmicks: [], lead: null, sweep: 0, legends: [] }, 'x');
    expect(r.seen).toBeUndefined();
    expect(longestSweep([{ by: 'a', turn: 1 }, { by: 'a', turn: 3 }, { by: 'a', turn: 4 }, { by: 'b', turn: 2 }])).toBe(3);
    expect(longestSweep([{ by: 'a', turn: 1 }, { by: 'a', turn: 5 }, { by: 'a', turn: 9 }])).toBe(1);
  });

  it('a trigger needs its count in two different battles unless it is 1x', () => {
    const setup = ADAPT.triggers.find((t) => t.id === 'setup')!;
    expect(triggerFires({ seen: [seen('setup', '', 'a', 2)] }, setup)).toBeNull();
    expect(triggerFires({ seen: [seen('setup', '', 'a', 2), seen('setup', '', 'b', 1)] }, setup)).toBeNull();
    expect(triggerFires({ seen: [seen('setup', '', 'a', 2), seen('setup', '', 'b', 3)] }, setup)).not.toBeNull();
    const lead = ADAPT.triggers.find((t) => t.id === 'knownLead')!;
    expect(triggerFires({ seen: ['a', 'b', 'c'].map((at) => seen('lead', 'pikachu', at)) }, lead)).toEqual({ value: 'pikachu' });
    expect(triggerFires({ seen: [seen('lead', 'pikachu', 'a'), seen('lead', 'eevee', 'b'), seen('lead', 'pikachu', 'c')] }, lead)).toBeNull();
    expect(triggerFires({ seen: [seen('gimmick', 'mega', 'a')] }, ADAPT.triggers.find((t) => t.id === 'bigMoment')!)).not.toBeNull();
    expect(ADAPT.triggers.map((t) => t.n)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);
  });

  it('a meeting gets at most 1 hard and 1 soft counter, each telegraphed, and never from unseen play', () => {
    const run = newRun('w2t', 3);
    const r = rival({ ace: 'pidgey' });
    const p = plan(['gastly', 'magnemite', 'pidgeot']);
    expect(rivalAdaptation(content, run, r, p, false, 3)).toMatchObject({ applied: [], lines: [] });
    r.seen = [
      ...['a', 'b'].flatMap((at) => [seen('setup', '', at, 2), seen('switches', '', at, 5), seen('status', '', at, 2), seen('pivot', '', at, 2)]),
    ];
    const got = rivalAdaptation(content, run, r, p, false, 3);
    expect(got.applied).toHaveLength(2);
    expect(got.applied[0]).toBe('setup');
    expect(got.applied[1]).toBe('statusGuard');
    expect(got.lines[0]).toContain('watched you stack boosts');
    expect(got.lines[1]).toContain('packed something against status');
    expect(got.plan.members.some((m) => m.moves?.includes('haze') || m.moves?.includes('roar') || m.moves?.includes('taunt'))).toBe(true);
    expect(got.plan.members.some((m) => m.held?.['lum-berry'])).toBe(true);
    expect(firedTriggers(run, r)).toEqual(['setup', 'statusGuard']);
    // The resist swap already used the hard slot: only a soft counter.
    const run2 = newRun('w2t2', 3);
    expect(rivalAdaptation(content, run2, r, p, true, 3).applied).toEqual(['statusGuard']);
    // Deterministic.
    expect(rivalAdaptation(content, newRun('w2t', 3), r, p, false, 3)).toEqual(got);
  });

  it('1x triggers fire once; the legend trigger only sharpens the AI; a rival that cannot adapt does not', () => {
    const run = newRun('w2x', 3);
    const r = rival({ ace: 'pidgey', seen: [seen('legend', 'mewtwo', 'a')] });
    const p = plan(['gastly', 'pidgeot']);
    const first = rivalAdaptation(content, run, r, p, false, 3);
    expect(first.applied).toEqual(['legend']);
    expect(first.plan.ai).toBeCloseTo(0.6);
    expect(first.plan.members).toEqual(p.members);
    expect(rivalAdaptation(content, run, r, p, false, 3).applied).toEqual([]);
    // A friendly (sparring) rival never adapts.
    const friendly = rival({ ace: 'pidgey', seen: [seen('legend', 'mewtwo', 'a')], traits: { empathy: 50, vindictiveness: 30, resilience: 50, pride: 40, ambition: 50, adaptability: 0 } });
    expect(rivalAdaptation(content, newRun('w2f', 3), friendly, p, false, 3).applied).toEqual([]);
  });

  it('a one-hit sweeper earns the ace a Focus Sash, but never next to a wide coverage move', () => {
    const run = newRun('w2s', 3);
    const r = rival({ ace: 'dratini', seen: [seen('sweep', '', 'a'), seen('sweep', '', 'b')] });
    const got = rivalAdaptation(content, run, r, plan(['gastly', 'dragonite']), false, 3);
    expect(got.applied).toEqual(['oneHit']);
    expect(got.plan.members[1]!.held).toEqual({ 'focus-sash': 1 });
    const wide = plan(['gastly', 'dragonite']);
    wide.members[1]!.moves = ['earthquake', 'dragon-claw'];
    expect(rivalAdaptation(content, newRun('w2s2', 3), r, wide, false, 3).applied).toEqual([]);
  });
});
