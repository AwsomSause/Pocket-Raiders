// DOMINION slice D13: the Debate, offline (plans/evil-mode-rework BUILD_SLICES.md; Part 4 §3, Part 9 A2-A4 and A6).
import { freshChair } from '../../src/core/dominion/chair';
import { describe, expect, it } from 'vitest';
import { withCrew } from '../../src/core/dominion/crew';
import { DOMINION_DATA } from '../../src/core/dominion/data';
import {
  beaten, branchStep, claimHolds, debateOf, directiveLabels, fearOf, openDebate, resultOf, scoreLine, sinOf, startConviction, strengths, tributeOf, whyNot, withDebate,
} from '../../src/core/dominion/debate';
import { debateModel } from '../../src/core/dominion/debateScreens';
import { card } from '../../src/core/dominion/field';
import { hqFx } from '../../src/core/dominion/hqFx';
import { answerCard, cardChoices, forceAction, rivalsOf, withRivals } from '../../src/core/dominion/rivals';
import { rivalFileModel, threatRow } from '../../src/core/dominion/rivalScreens';
import { DOMINION_MODE_ID, startInRun, stepInRun } from '../../src/core/dominion/session';
import { DominionBlockSchema, type DominionAction, type DominionBlock } from '../../src/core/dominion/schema';
import { STANDARD_CHOICE } from '../../src/core/rules';
import { chooseStarter, createRun } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { SaveManager } from '../../src/save/saveManager';
import { MemoryStorageProvider } from '../../src/save/storage';
import { content } from './helpers';

const DB = DOMINION_DATA.debate;
const T = 'rocket';
const HQ = DOMINION_DATA.field.hq;
const domRun = (seed: string): RunState => chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red', rules: { ...STANDARD_CHOICE, modeId: DOMINION_MODE_ID } }), 0);
const started = (seed = 'dm13'): RunState => {
  const out = startInRun(content, domRun(seed), { types: ['poison', 'dark'], member: 'grunt', look: 0 });
  expect(out.problem).toBeNull();
  return quiet(stepInRun(content, out.run, { t: 'open' }).run);
};
/** D12: the Chair is switched off here, so these nights stay the same as before it. */
function quiet(r: RunState): RunState {
  const out = structuredClone(r);
  out.expansion!.dominion!.chair = { ...freshChair(), opts: { length: 'off', numbers: 'arrows', speed: 'normal' } };
  return out;
}
const blk = (r: RunState): DominionBlock => r.expansion!.dominion!;
const go = (r: RunState, a: DominionAction): RunState => {
  const out = stepInRun(content, r, a);
  expect(out.ok, `${a.t}: ${out.notice}`).toBe(true);
  return out.run;
};
type Full = DominionBlock & { rivals: NonNullable<DominionBlock['rivals']>; debate: NonNullable<DominionBlock['debate']> };
const edit = (r: RunState, f: (b: Full) => void): RunState => {
  const b = withDebate(withRivals(withCrew(structuredClone(blk(r))))) as Full;
  f(b);
  return { ...r, expansion: { ...r.expansion, dominion: DominionBlockSchema.parse(b) } };
};
/** A run with a Debate with Giovanni on the table. */
const table = (seed = 'dm13', f: (b: Full) => void = () => {}): RunState => edit(started(seed), (b) => {
  b.rivals.teams[T]!.tension = 50;
  f(b);
  openDebate(b, T);
});
const live = (r: RunState) => blk(r).debate!.live!;
const argueAll = (r: RunState, ids: string[]): RunState => ids.reduce((x, id) => go(x, { t: 'argue', line: id }), r);
const answerAll = (r: RunState): RunState => {
  while (blk(r).crew?.talks.length) r = go(r, { t: 'talk', choice: 0 });
  return r;
};
const night = (r: RunState): RunState => answerAll(go(go(r, { t: 'toNight' }), { t: 'rest' }));

describe('DOMINION D13: the data', () => {
  it('three rounds, four stances with three set lines each, five marks, four results, five orders, every rival Boss written', () => {
    expect(DB.rounds.map((r) => r.id)).toEqual(['values', 'methods', 'future']);
    expect(DB.stances.map((s) => s.name)).toEqual(['Partnership', 'Merger', 'Recruit {them}', 'Threaten']);
    for (const s of DB.stances) expect(DB.lines.filter((l) => l.stance === s.id)).toHaveLength(3);
    expect(DB.marks.map((m) => m.name)).toEqual(['Values', 'Record', 'Substance', 'Respect', 'Honesty']);
    expect(DB.results.map((r) => [r.id, r.min])).toEqual([['convinced', 60], ['persuaded', 25], ['unmoved', -24], ['offended', -100]]);
    expect(DB.directives.map((d) => d.name)).toEqual(['Expand', 'Defend', 'Recruit', 'Pressure the Hero', 'Hold a town']);
    for (const t of DOMINION_DATA.rivals.teams) expect(DB.bosses[t.id], t.id).toBeDefined();
    // Players see "Rotom", never the model or company (claude-api rule): nothing in the Debate's text says Claude or AI.
    expect(JSON.stringify({ ...DB, bosses: undefined })).not.toMatch(/Claude|\bAI\b/);
  });
  it('the Debate and Write a Manifesto actions are played now; two rival actions and four rooms wait on D13 no more', () => {
    expect(DOMINION_DATA.field.play['debate']?.effect).toBe('debate');
    expect(DOMINION_DATA.field.play['write-a-manifesto']?.effect).toBe('manifesto');
    expect(DOMINION_DATA.rivalActions.actions.filter((a) => a.waits === 'D13')).toEqual([]);
    expect(DOMINION_DATA.rivalActions.actions.filter((a) => a.kind === 'debate').map((a) => a.id)).toEqual(['break-a-coalition', 'neutral-ground-summit']);
    expect(DOMINION_DATA.buildings.filter((x) => x.waits === 'D13')).toEqual([]);
    expect(DOMINION_DATA.buildings.find((x) => x.id === 'debate-hall')!.fx).toEqual({ debateFloor: 5 });
    expect(DOMINION_DATA.buildings.find((x) => x.id === 'briefing-theater')!.fx).toEqual({ debateSee: 1 });
  });
});

describe('DOMINION D13: who will talk (Part 4 §3.1)', () => {
  it('the Debate action needs Tension 40+ and a win over one of theirs; an invitation needs neither', () => {
    const b = withDebate(withRivals(structuredClone(blk(started()))));
    b.rivals.teams[T]!.tension = 39;
    expect(whyNot(b, T, 'action')).toMatch(/Tension 40\+/);
    b.rivals.teams[T]!.tension = 40;
    expect(whyNot(b, T, 'action')).toMatch(/beat one of their Admins/);
    expect(whyNot(b, T, 'invite')).toBeNull();
    b.flags.push(`beat:${T}:admin`);
    expect(beaten(b, T)).toBe('admin');
    expect(whyNot(b, T, 'action')).toBeNull();
  });
  it('one Debate a Boss a week; three failed and they never talk again this region (boundary)', () => {
    let r = table();
    r = go(r, { t: 'walkOut' });
    expect(whyNot(blk(r), T, 'invite')).toMatch(/One Debate with Giovanni a week/);
    r = edit(r, (b) => { b.day += 7; openDebate(b, T); });
    r = go(r, { t: 'walkOut' });
    r = edit(r, (b) => { b.day += 7; });
    expect(whyNot(blk(r), T, 'invite')).toBeNull();
    r = edit(r, (b) => openDebate(b, T));
    r = go(r, { t: 'walkOut' });
    r = edit(r, (b) => { b.day += 7; });
    expect(debateOf(blk(r)).tries[T]).toMatchObject({ fails: 3, closed: true });
    expect(whyNot(blk(r), T, 'invite')).toMatch(/never talk to you again/);
  });
  it('the Debate action on the Card: blocked with the reason, then it sits Giovanni down', () => {
    const day = (f: (b: Full) => void): RunState => go(night(edit(started('act'), f)), { t: 'toDay' });
    const no = day((b) => { b.rivals.teams[T]!.tension = 60; });
    expect(card(blk(no), no, 'debate', null, HQ)!.blocked).toMatch(/beat one of their Admins/);
    let r = day((b) => { b.rivals.teams[T]!.tension = 60; b.flags.push(`beat:${T}:boss`); });
    expect(card(blk(r), r, 'debate', null, HQ)!.blocked).toBeNull();
    r = go(r, { t: 'act', action: 'debate', target: null, district: HQ, bring: [] });
    expect(live(r)).toMatchObject({ team: T, who: 'boss', name: 'Giovanni', phase: 'argue', rounds: ['values', 'methods', 'future'] });
    expect(live(r).said).toMatch(/Power is the only honest currency/);
    // A Debate on the table blocks another.
    expect(whyNot(blk(r), T, 'invite')).toMatch(/already on/);
  });
});

describe('DOMINION D13: the Conviction meter (A2)', () => {
  it('starts from Tension, wins, Admins gone, the manifesto, mastery and rooms, capped at ±20', () => {
    const b = withDebate(withRivals(structuredClone(blk(started()))));
    b.rivals.teams[T]!.tension = 50;
    expect(startConviction(b, T)).toBe(0);
    b.rivals.teams[T]!.tension = 70;
    expect(startConviction(b, T)).toBe(-10);
    b.flags.push(`beat:${T}:boss`);
    expect(startConviction(b, T)).toBe(0);
    b.rivals.teams[T]!.admins = ['archer'];
    expect(startConviction(b, T)).toBe(15);
    b.debate.pages = 9;
    expect(startConviction(b, T)).toBe(20);
  });
  it('scores a line: (sum − 10) × 2, the Boss leans, a claim the Ledger can\'t back scores 0 Record and Honesty', () => {
    const r = table();
    const b = blk(r);
    const p1 = scoreLine(b, live(r), 'p1')!;
    // Giovanni leans +1 Values towards a partnership: 5 + 3 + 4 + 4 + 3 = 19 -> +18.
    expect(p1).toMatchObject({ marks: [5, 3, 4, 4, 3], move: 18, mod: 0, claim: null, held: true });
    // "My crew already runs more towns than you think": you hold none.
    expect(claimHolds(b, 'towns', T)).toBe(false);
    expect(scoreLine(b, live(r), 'p3')).toMatchObject({ marks: [4, 0, 3, 3, 0], held: false, move: 0 });
    // Threaten: −5 unless your Dread is twice their Fear; the move never goes under −15.
    expect(fearOf(b, T)).toBeGreaterThan(0);
    expect(scoreLine(b, live(r), 't3')).toMatchObject({ mod: -5, move: -15 });
    // Merger: −5 unless you're stronger.
    expect(strengths(b, T).yours).toBeLessThan(strengths(b, T).theirs);
    expect(scoreLine(b, live(r), 'm2')!.mod).toBe(-5);
  });
  it('a claim the Ledger backs gains a Record point; a robbery breaks "clean hands"', () => {
    const r = table('dm13', (b) => { b.funds = 6000; });
    expect(scoreLine(blk(r), live(r), 'm1')).toMatchObject({ held: true, marks: [3, 4, 4, 3, 3] });
    expect(sinOf(blk(r))).toBeNull();
    const dirty = table('dm13', (b) => { b.field.mastery['thieve'] = 3; });
    expect(sinOf(blk(dirty))).toBe('You lifted wallets in a crowd');
    expect(scoreLine(blk(dirty), live(dirty), 'r3')).toMatchObject({ held: false });
  });
  it('an insult sours the next turn; the Debate Hall makes the first argument land', () => {
    let r = table();
    r = go(r, { t: 'argue', line: 't2' });
    expect(live(r).sour).toBe(true);
    expect(scoreLine(blk(r), live(r), 'p1')!.mod).toBe(-5);
    expect(scoreLine(blk(table()), live(table()), 't3')!.move).toBe(-15);
    const hall = table('dm13', (b) => { b.hq!.rooms.push({ uid: 'dh', id: 'debate-hall', tier: 1, cond: 100, spent: 3000, building: false, up: false, ready: 0, shut: false, ruined: false, at: null }); });
    expect(hqFx(blk(hall)).debateFloor).toBe(5);
    expect(scoreLine(blk(hall), live(hall), 't3')!.move).toBe(5);
    // Only the first argument.
    const two = go(hall, { t: 'argue', line: 'p1' });
    expect(scoreLine(blk(two), live(two), 't3')!.move).toBe(-15);
  });
});

describe('DOMINION D13: a whole Debate and its results (A3, A4)', () => {
  it('six turns in three rounds: Methods opens on your worst Ledger line, The Future on their price; replies are stored', () => {
    let r = table('dm13', (b) => { b.field.mastery['shake-the-jar'] = 1; });
    r = argueAll(r, ['p1', 'p2']);
    expect(live(r).said).toMatch(/You emptied a Pokémon Center donation box\. Is that your 'order'\?/);
    r = argueAll(r, ['r1', 'm2']);
    expect(live(r).said).toMatch(/Silph stays mine/);
    expect(live(r).turns.every((t) => t.reply.length > 0)).toBe(true);
    const out = stepInRun(content, r, { t: 'argue', line: 'p1' });
    expect(out.ok).toBe(false);
    expect(out.notice).toBe('You already said that.');
  });
  it('Convinced: pick a Merger. Giovanni and his Admins join, Rocket\'s sites are yours, Rocket stops acting', () => {
    let r = table('merge', (b) => {
      b.flags.push(`beat:${T}:boss`);
      b.funds = 6000;
      b.rosterCap = 12;
      for (const id of Object.keys(b.field.districts).slice(0, 2)) b.field.districts[id]!.control = 70;
    });
    r = argueAll(r, ['p1', 'p2', 'p3', 'r1', 'm1', 'r3']);
    expect(live(r).conviction).toBeGreaterThanOrEqual(60);
    expect(live(r)).toMatchObject({ result: 'convinced', phase: 'choose' });
    const before = blk(r).members.length;
    r = go(r, { t: 'deal', kind: 'merger' });
    expect(live(r).phase).toBe('done');
    expect(blk(r).members.length).toBe(before + 5);
    expect(blk(r).members.find((m) => m.name === 'Giovanni')).toMatchObject({ rank: 'executive' });
    expect(Object.values(rivalsOf(blk(r)).teams[T]!.sites).filter((s) => s === 'theirs')).toEqual([]);
    r = go(r, { t: 'debateDone' });
    expect(blk(r).debate!.live).toBeNull();
    expect(threatRow(blk(r))).toBeNull();
    // Rocket's step does nothing now.
    const forced = rivalsOf(blk(r)).teams[T]!.log.length;
    r = night(r);
    expect(rivalsOf(blk(r)).teams[T]!.log.length).toBe(forced);
  });
  it('Persuaded: a Branch with one demand; it pays tribute on Monday and takes the Branch Directive', () => {
    let r = table('branch', (b) => { b.flags.push(`beat:${T}:admin`); });
    r = argueAll(r, ['p1', 'p2', 'r1', 'm2', 'r2', 'm1']);
    const res = resultOf(live(r).conviction).id;
    expect(res).toBe('persuaded');
    expect(live(r).phase).toBe('done');
    const deal = blk(r).debate!.deals[T]!;
    expect(deal).toMatchObject({ kind: 'branch', loyal: false, risk: 20, order: 'expand' });
    expect(['hq', 'towns']).toContain(deal.demand);
    r = go(r, { t: 'debateDone' });
    // Monday morning: tribute in, a Directive card on the Rival File.
    r = edit(r, (b) => { b.day = 7; });
    const funds = blk(r).funds;
    r = night(r);
    expect(blk(r).day).toBe(8);
    expect(blk(r).funds).toBeGreaterThan(funds);
    const i = rivalsOf(blk(r)).cards.findIndex((c) => c.kind === 'directive');
    expect(i).toBeGreaterThanOrEqual(0);
    expect(cardChoices(rivalsOf(blk(r)).cards[i]!)).toEqual(directiveLabels());
    r = go(r, { t: 'card', index: i, choice: 4 });
    expect(blk(r).debate!.deals[T]!.order).toBe('hold');
    expect(rivalFileModel(blk(r), 0)!.deal).toMatch(/Your Branch since Day 1.*This week: Hold a town/);
  });
  it('a broken demand: betrayal risk +25, and the Branch may walk', () => {
    const r = table('walk');
    const b = withDebate(withRivals(structuredClone(blk(r)))) as Full;
    b.debate.live = null;
    const d = Object.keys(b.field.districts)[0]!;
    b.debate.deals[T] = { kind: 'branch', since: 1, loyal: false, risk: 20, demand: 'hq', towns: [d], base: { [d]: 0 }, members: 10, order: 'defend', hold: null, holdAt: 0, hero: 0 };
    b.field.districts[d]!.control = 30;
    const lines = branchStep(b, 'walk');
    expect(lines[0]).toMatch(/betrayal risk \+25/);
    if (b.debate.deals[T]) expect(b.debate.deals[T]).toMatchObject({ risk: 45, demand: null });
    else expect(rivalsOf(b).teams[T]!.tension).toBe(50);
  });
  it('Unmoved: Tension −10 and a failed try; Offended: Tension +15 and they never talk again', () => {
    let r = table('meh', (b) => { b.flags.push(`beat:${T}:admin`); b.rivals.teams[T]!.tension = 60; });
    r = argueAll(r, ['t1', 'r2', 'm3', 't2', 'r3', 'm1']);
    expect(live(r)).toMatchObject({ result: 'unmoved', phase: 'done', conviction: -16 });
    expect(rivalsOf(blk(r)).teams[T]!.tension).toBe(50);
    expect(debateOf(blk(r)).tries[T]).toMatchObject({ fails: 1, closed: false });
    let bad = table('rude');
    bad = argueAll(bad, ['t3', 't2', 't1', 'm3', 'r2', 'm2']);
    expect(live(bad).result).toBe('offended');
    expect(rivalsOf(blk(bad)).teams[T]!.tension).toBe(65);
    expect(debateOf(blk(bad)).tries[T]!.closed).toBe(true);
    expect(resultOf(0).id).toBe('unmoved');
    expect(resultOf(-25).id).toBe('offended');
    expect(resultOf(24).id).toBe('unmoved');
    expect(resultOf(25).id).toBe('persuaded');
    expect(resultOf(59).id).toBe('persuaded');
    expect(resultOf(60).id).toBe('convinced');
  });
  it('the rival summit and the coalition card: sit down from the Rival File (an Admin debates in two rounds)', () => {
    let r = edit(started('summit'), (b) => { b.rivals.teams[T]!.tension = 40; });
    const f = forceAction(blk(r), T, 'break-a-coalition', 'summit');
    r = { ...r, expansion: { ...r.expansion, dominion: DominionBlockSchema.parse(f.block) } };
    const i = rivalsOf(blk(r)).cards.findIndex((c) => c.kind === 'debate');
    const c = rivalsOf(blk(r)).cards[i]!;
    expect(cardChoices(c)).toEqual(['Sit down for a Debate', 'Not now']);
    r = go(r, { t: 'card', index: i, choice: 0 });
    expect(live(r).who).not.toBe('boss');
    expect(live(r).rounds).toEqual(['values', 'future']);
    r = argueAll(r, ['p1', 'r1', 'p2', 'm2']);
    expect(live(r).phase).toBe('done');
    if (live(r).result === 'convinced' || live(r).result === 'persuaded') expect(rivalsOf(blk(r)).teams[T]!.admins).not.toContain(live(r).who);
    const s = forceAction(withRivals(structuredClone(blk(started('s2')))), T, 'neutral-ground-summit', 's2');
    expect(withRivals(s.block).rivals.cards.find((x) => x.kind === 'debate')!.who).toBe('Giovanni');
  });
  it('a card answered while another Debate is on is refused (failure)', () => {
    let r = table('two');
    r = edit(r, (b) => { b.rivals.cards.push({ kind: 'debate', team: T, ref: 'neutral-ground-summit', who: 'Giovanni', amount: 0, district: null, ask: null, until: 9 }); });
    const out = answerCard(blk(r), rivalsOf(blk(r)).cards.length - 1, 0, 'two');
    expect(out.ok).toBe(false);
    expect(out.notice).toMatch(/already on/);
  });
});

describe('DOMINION D13: the screen model, saves', () => {
  it('mockup 8: round, Conviction, verdict, stances (Recruit him), the line box and the results', () => {
    let r = table();
    let m = debateModel(blk(r), { stance: 2, line: 0 })!;
    expect(m).toMatchObject({ boss: 'Giovanni', tag: 'ROCKET', round: { num: 'I', name: 'Values' }, turn: 1, turns: 6, verdict: null, phase: 'argue' });
    expect(m.stances.map((s) => s.name)).toEqual(['Partnership', 'Merger', 'Recruit him', 'Threaten']);
    expect(m.lines).toHaveLength(3);
    expect(m.lines[0]!.preview).toBeNull();
    r = go(r, { t: 'argue', line: 'p1' });
    m = debateModel(blk(r), { stance: 0, line: 0 })!;
    expect(m.verdict!.move).toBe(18);
    expect(m.verdict!.marks.map((x) => x.n)).toEqual([5, 3, 4, 4, 3]);
    expect(m.lines[0]!.used).toBe(true);
    expect(m.stances[0]!.left).toBe(2);
  });
  it('an old save without the block\'s `debate` loads; save and reload mid-Debate replays the same result', () => {
    const r = started('old');
    const parsed = DominionBlockSchema.parse(structuredClone(blk(r)));
    expect(parsed.debate).toBeUndefined();
    expect(debateOf(parsed).live).toBeNull();
    let x = table('sav', (b) => { b.flags.push(`beat:${T}:admin`); });
    x = argueAll(x, ['p1', 'm2']);
    const storage = new MemoryStorageProvider();
    new SaveManager(storage, content).saveRun(x);
    const loaded = new SaveManager(storage, content).loadRun();
    expect(loaded.status).toBe('ok');
    if (loaded.status !== 'ok') return;
    expect(loaded.data).toEqual(x);
    const a = argueAll(x, ['r1', 'p2', 'm1', 'r2']);
    const b = argueAll(loaded.data, ['r1', 'p2', 'm1', 'r2']);
    expect(live(b)).toEqual(live(a));
  });
  it('a broken Debate block fails the schema (failure)', () => {
    const b = withDebate(structuredClone(blk(table())));
    b.debate.live!.conviction = 140;
    expect(DominionBlockSchema.safeParse(b).success).toBe(false);
    const c = withDebate(structuredClone(blk(started())));
    (c.debate.deals as Record<string, unknown>)[T] = { kind: 'vassal' };
    expect(DominionBlockSchema.safeParse(c).success).toBe(false);
  });
  it('the Branch tribute grows with the Branch', () => {
    const b = blk(table());
    const deal = { kind: 'branch' as const, since: 1, loyal: true, risk: 10, demand: null, towns: [], base: {}, members: 10, order: 'expand' as const, hold: null, holdAt: 0, hero: 0 };
    expect(tributeOf(b, { ...deal, members: 13 })).toBeGreaterThan(tributeOf(b, deal));
  });
});
