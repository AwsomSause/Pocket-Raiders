// Stand With Them (slice E8): code name, reputation ladder, eligibility, verdicts, Second Shot, rival handed over.

import { describe, expect, it } from 'vitest';
import { STAND, standWithClimaxLost, standWithPlayable, accessOf, addMercy, bandOf, changeRep, codeNameOf, freeHandedOverRival, joinInsideMan, joinProblem, lostStandWithClimax, officersSide, resolveVerdict, standWithOf, standWithStatus, standingLine, verdictsOpen } from '../../src/core/arc/standWithExtended';
import { ExpansionRunSchema } from '../../src/core/expansion/schema';
import { applyEffect, conditionMet, eventBattleWon } from '../../src/core/events';
import { activeHolds } from '../../src/core/evil/rescue';
import { evilOf, evilSummary } from '../../src/core/evil/teams';
import { Rng, hashSeed } from '../../src/core/rng';
import { chooseStarter, createRun } from '../../src/core/run';
import { createPokemon } from '../../src/core/pokemon';
import { content } from './helpers';

const fresh = (seed: string, team: string | null = 'rocket') => {
  const run = structuredClone(chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red' }), 0));
  if (team) evilOf(run).teamId = team;
  return run;
};
const rng = () => new Rng(hashSeed('sw'));

describe('joining', () => {
  it('needs the run\'s own team to have a code name; Kanto Rocket is House Card', () => {
    expect(joinProblem(fresh('a', null))).toMatch(/noticed/);
    expect(joinProblem(fresh('b', 'yell'))).toMatch(/no use/);
    const run = fresh('c');
    expect(joinProblem(run)).toBeNull();
    expect(joinInsideMan(run)).toContain('House Card');
    expect(codeNameOf(run)).toBe('Provisional Agent 000 "House Card"');
    expect(standWithOf(run)!.rep).toBe(30);
    expect(() => joinInsideMan(run)).toThrow(/already/);
  });
  it('every code name in the data is for a distinct team', () => {
    expect(new Set(STAND.codeNames.map((c) => c.team)).size).toBe(STAND.codeNames.length);
  });
});

describe('reputation ladder', () => {
  it('bands at 29, 30, 44, 45, 59, 60, 69, 70', () => {
    expect([29, 30, 44, 45, 59, 60, 69, 70].map((r) => bandOf(r)?.band ?? 'none')).toEqual(['none', 'Recognized', 'Recognized', 'Respected', 'Respected', 'Trusted', 'Trusted', 'Allied']);
  });
  it('rungs give access and information only, never statistics', () => {
    const run = fresh('l');
    joinInsideMan(run);
    expect(accessOf(run)).toContain('The team shop');
    expect(accessOf(run).join(' ')).not.toMatch(/damage|attack|stat|HP/i);
    changeRep(run, 15);
    expect(accessOf(run)).toContain('[Stand with them] unlocks');
    expect(JSON.stringify(STAND.ladder)).not.toMatch(/\+\d+% |damage/i);
  });
  it('named changes follow the table; refusing an order never drops you below your band', () => {
    const run = fresh('r');
    joinInsideMan(run);
    expect(changeRep(run, 'team-mission')).toBe(38);
    expect(changeRep(run, 'refuse-order')).toBe(34);
    expect(changeRep(run, 'refuse-order')).toBe(30);
    expect(changeRep(run, 'refuse-order')).toBe(30);
    expect(changeRep(run, 'sabotage-triumph')).toBe(10);
    expect(() => changeRep(run, 'nope')).toThrow(/Unknown/);
    changeRep(run, 500);
    expect(standWithOf(run)!.rep).toBe(100);
    expect(changeRep(fresh('nj'), 5)).toBeNull();
  });
  it('a noticed mercy costs 2 and still counts', () => {
    const run = fresh('m');
    joinInsideMan(run);
    addMercy(run, true);
    addMercy(run, false);
    expect(standWithOf(run)).toMatchObject({ mercies: 2, rep: 28 });
  });
  it('the hideout line and the evil summary show where you stand', () => {
    const run = fresh('h');
    expect(standingLine(run)).toBeNull();
    joinInsideMan(run);
    expect(standingLine(run)).toContain('People stop talking');
    expect(evilSummary(content, run)!.lines.some((l) => l.includes('House Card'))).toBe(true);
  });
});

describe('the Stand-with button and verdicts', () => {
  it('is hidden before joining, locked with a reason below +45, open at +45, locked after Turn or betrayal', () => {
    const run = fresh('s');
    expect(standWithStatus(run)).toEqual({ shown: false, open: false, reason: null });
    joinInsideMan(run);
    expect(standWithStatus(run)).toMatchObject({ shown: true, open: false });
    expect(standWithStatus(run).reason).toContain('+45');
    changeRep(run, 15);
    expect(standWithStatus(run).open).toBe(true);
    standWithOf(run)!.turned = true;
    expect(standWithStatus(run).reason).toContain('Turn');
    standWithOf(run)!.turned = false;
    standWithOf(run)!.betrayed = true;
    expect(standWithStatus(run).open).toBe(false);
  });
  it('Take the Throne needs +70; letting go the Apex leaves only Turn', () => {
    const run = fresh('v');
    joinInsideMan(run);
    changeRep(run, 20);
    expect(verdictsOpen(run, 'hold')).toEqual(['rise', 'turn']);
    changeRep(run, 20);
    expect(verdictsOpen(run, 'hold')).toEqual(['rise', 'throne', 'turn']);
    expect(verdictsOpen(run, 'letgo')).toEqual(['turn']);
    expect(verdictsOpen(fresh('x'), 'hold')).toEqual([]);
  });
  it('Rise holds the Apex, Throne may free it, Turn frees it and is remembered', () => {
    const a = fresh('a1');
    joinInsideMan(a);
    resolveVerdict(content, a, 'rise', { apex: 'hold' });
    expect(standWithOf(a)).toMatchObject({ apex: 'taken', verdict: 'rise' });
    expect(() => resolveVerdict(content, a, 'rise', { apex: 'hold' })).toThrow(/already/);
    const b = fresh('b1');
    joinInsideMan(b);
    changeRep(b, 40);
    resolveVerdict(content, b, 'throne', { apex: 'hold', keepApexBound: false });
    expect(standWithOf(b)!.apex).toBe('freed');
    const c = fresh('c1');
    joinInsideMan(c);
    resolveVerdict(content, c, 'turn', { apex: 'hold' });
    expect(standWithOf(c)).toMatchObject({ apex: 'freed', turned: true });
    expect(standWithStatus(c).open).toBe(false);
    expect(() => resolveVerdict(content, fresh('d1'), 'rise', { apex: 'none' })).toThrow(/not joined/);
    const e = fresh('e1');
    joinInsideMan(e);
    expect(() => resolveVerdict(content, e, 'throne', { apex: 'hold' })).toThrow(/not open/);
  });
  it('officers: at +85 the majority side with you; three mercies bring the runner forward', () => {
    const run = fresh('o');
    joinInsideMan(run);
    changeRep(run, 40);
    expect(officersSide(run, 5)).toEqual({ withPlayer: 2, runnerFirst: false });
    changeRep(run, 20);
    addMercy(run, false); addMercy(run, false); addMercy(run, false);
    expect(officersSide(run, 5)).toEqual({ withPlayer: 3, runnerFirst: true });
  });
});

describe('Second Shot and the rival handed over', () => {
  it('the first loss retries, the second gives the worst ending, and nothing ends the run', () => {
    const run = fresh('ss');
    joinInsideMan(run);
    expect(lostStandWithClimax(run)).toBe('retry');
    expect(lostStandWithClimax(run)).toBe('worst');
    expect(standWithOf(run)!.ledger).toContain('allied-defeat');
    expect(run.phase).not.toBe('over');
    expect(() => lostStandWithClimax(fresh('nj'))).toThrow();
  });
  it('handing the rival over impounds bench Pokémon so the Rescue offer can start; the rival is freed at run end', () => {
    const run = fresh('ho', 'rocket');
    for (const id of ['rattata', 'pidgey', 'caterpie']) run.party.push(createPokemon(content, id, 5, `x${id}`));
    joinInsideMan(run);
    const before = run.party.length;
    const r = resolveVerdict(content, run, 'rise', { apex: 'none', rival: 'handOver' });
    expect(r.hold).not.toBeNull();
    expect(run.party.length).toBeLessThan(before);
    expect(activeHolds(run).length).toBeGreaterThan(0);
    expect(standWithOf(run)!.rivalHandedOver).toBe(true);
    expect(freeHandedOverRival(run)).toBe(true);
    expect(standWithOf(run)!.rivalHandedOver).toBe(false);
    expect(freeHandedOverRival(run)).toBe(false);
    expect(standWithOf(run)!.ledger).toContain('rival-freed-at-run-end');
  });
  it('releasing the rival impounds nothing; Turn offers no hand-over', () => {
    const run = fresh('rl');
    for (const id of ['rattata', 'pidgey', 'caterpie']) run.party.push(createPokemon(content, id, 5, `x${id}`));
    joinInsideMan(run);
    expect(resolveVerdict(content, run, 'rise', { apex: 'none', rival: 'release' }).hold).toBeNull();
    const t = fresh('rt');
    joinInsideMan(t);
    resolveVerdict(content, t, 'turn', { apex: 'none', rival: 'handOver' });
    expect(standWithOf(t)!.rivalHandedOver).toBe(false);
  });
});

describe('events and saves', () => {
  it('the join effect and conditions work, and the state survives its schema', () => {
    const run = fresh('ev');
    evilOf(run).beat = 3;
    expect(conditionMet(content, run, { kind: 'standWith', joined: false })).toBe(true);
    expect(conditionMet(content, run, { kind: 'standWith', joined: true })).toBe(false);
    expect(applyEffect(content, run, { kind: 'standWith', action: 'join', noticed: false }, rng())).toContain('House Card');
    expect(conditionMet(content, run, { kind: 'standWith', joined: true })).toBe(true);
    expect(conditionMet(content, run, { kind: 'standWith', joined: true, minRep: 45 })).toBe(false);
    applyEffect(content, run, { kind: 'standWith', action: 'rep', change: 'team-mission', noticed: false }, rng());
    expect(standWithOf(run)!.rep).toBe(38);
    const back = ExpansionRunSchema.parse(JSON.parse(JSON.stringify(run.expansion)));
    expect(back.standWith).toEqual(run.expansion!.standWith);
    expect(ExpansionRunSchema.parse({}).standWith).toBeUndefined();
  });
});

describe('the Stand-with climax in play', () => {
  const hideoutChoice = (run: ReturnType<typeof fresh>) => {
    const id = 'stand-with-hideout';
    const ev = content.events.get(id)!;
    const idx = ev.choices.findIndex((c) => c.label.startsWith('[Stand with them]'));
    return { id, ev, idx };
  };
  it('the hideout offers [Stand with them] only to an Inside Man at +45 or more, and its loss is Second Shot', () => {
    const run = fresh('cl');
    const { ev, idx } = hideoutChoice(run);
    expect(idx).toBeGreaterThanOrEqual(0);
    const cond = ev.requires!;
    evilOf(run).beat = 6;
    evilOf(run).nextAt = 0;
    expect(cond.every((c) => conditionMet(content, run, c))).toBe(false);
    joinInsideMan(run);
    expect(cond.every((c) => conditionMet(content, run, c))).toBe(false);
    changeRep(run, 15);
    expect(cond.every((c) => conditionMet(content, run, c))).toBe(true);
    const b = ev.choices[idx]!.success.battle!;
    expect(b).toMatchObject({ pseudo: true, standWith: true });
  });
  it('winning the defenders makes the verdict event due; each verdict choice works once', () => {
    const run = fresh('cw');
    joinInsideMan(run);
    changeRep(run, 20);
    const { id, idx } = hideoutChoice(run);
    eventBattleWon(content, run, { eventId: id, choiceIndex: idx, sideId: 'x', success: true });
    expect(standWithOf(run)!.climaxWon).toBe(true);
    const verdict = content.events.get('stand-with-verdict')!;
    const open = verdict.choices.filter((c) => (c.requires ?? []).every((r) => conditionMet(content, run, r)));
    expect(open.map((c) => c.label.split(':')[0]).sort()).toEqual(['Rise', 'Turn']);
    expect(verdict.choices.length).toBeLessThanOrEqual(4);
    const rise = open.find((c) => c.label.startsWith('Rise'))!;
    for (const e of rise.success.effects) applyEffect(content, run, e, rng());
    expect(standWithOf(run)).toMatchObject({ verdict: 'rise', climaxWon: false });
    expect(run.story.evil!.end).toBe('allied');
    expect(verdict.requires!.every((r) => conditionMet(content, run, r))).toBe(false);
  });
  it('at +70 the Throne is open, and a handed-over rival impounds through the verdict event', () => {
    const run = fresh('ct');
    for (const id of ['rattata', 'pidgey', 'caterpie']) run.party.push(createPokemon(content, id, 5, `x${id}`));
    joinInsideMan(run);
    changeRep(run, 50);
    standWithOf(run)!.climaxWon = true;
    const verdict = content.events.get('stand-with-verdict')!;
    const labels = verdict.choices.filter((c) => (c.requires ?? []).every((r) => conditionMet(content, run, r))).map((c) => c.label.split(':')[0]!.split(' (')[0]);
    expect(labels).toContain('Take the Throne');
  });
  it('two lost climax battles are the worst ending and the run goes on; the choice closes', () => {
    const run = fresh('cs');
    joinInsideMan(run);
    changeRep(run, 20);
    expect(standWithPlayable(run)).toBe(true);
    expect(standWithClimaxLost(run).next).toBe('retry');
    expect(standWithPlayable(run)).toBe(true);
    expect(standWithClimaxLost(run).next).toBe('worst');
    expect(standWithPlayable(run)).toBe(false);
    expect(run.phase).not.toBe('over');
  });
});
