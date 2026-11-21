// DOMINION slice D6b: what D5, D9 and D4 handed to D6 (town.ts). Hold a Rally and Chant Night, Pay the Wages on
// payday, the fifteen Regard/Dread buildings and the Recruitment Center's walk-in, and the fifty street meetings of
// outside-interactions.md sections A and J (met after a Boss action, answered on the Region Map), with save/reload.
import { describe, expect, it } from 'vitest';
import { withCrew, crewOf } from '../../src/core/dominion/crew';
import { DOMINION_DATA } from '../../src/core/dominion/data';
import { actionDef, actionStatus, card, settle } from '../../src/core/dominion/field';
import { hqFx, withHq } from '../../src/core/dominion/hqFx';
import { hqStep } from '../../src/core/dominion/hq';
import { empireOf } from '../../src/core/dominion/book';
import { DominionBlockSchema, type DominionAction, type DominionBlock, type Room } from '../../src/core/dominion/schema';
import { DOMINION_MODE_ID, startInRun, stepInRun } from '../../src/core/dominion/session';
import { answerMeet, hasRallied, maybeMeet, meetModel } from '../../src/core/dominion/town';
import { runWorldTurn } from '../../src/core/dominion/worldTurn';
import { STANDARD_CHOICE } from '../../src/core/rules';
import { chooseStarter, createRun } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { content } from './helpers';

const TW = DOMINION_DATA.town;
const domRun = (seed: string): RunState => chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red', rules: { ...STANDARD_CHOICE, modeId: DOMINION_MODE_ID } }), 0);
const started = (seed = 'd6b'): RunState => {
  const out = startInRun(content, domRun(seed), { types: ['poison', 'dark'], member: 'grunt', look: 0 });
  expect(out.problem).toBeNull();
  return stepInRun(content, out.run, { t: 'open' }).run;
};
const blk = (r: RunState): DominionBlock => r.expansion!.dominion!;
const step = (r: RunState, a: DominionAction) => stepInRun(content, r, a);
const go = (r: RunState, a: DominionAction): RunState => {
  const out = step(r, a);
  expect(out.ok, `${a.t}: ${out.notice}`).toBe(true);
  return out.run;
};
const edit = (r: RunState, f: (b: DominionBlock) => void): RunState => {
  const b = withCrew(structuredClone(blk(r)));
  f(b);
  return { ...r, expansion: { ...r.expansion, dominion: DominionBlockSchema.parse(b) } };
};
const room = (id: string, at: string | null = null, tier = 1): Room => ({ uid: `t-${id}`, id, tier, cond: 100, spent: 0, building: false, up: false, ready: 0, shut: false, ruined: false, at });
/** The morning of a Day in Viridian (a Pokémon Center target), sharp and rich, the Radio Room built. */
const dayIn = (seed: string, f: (b: DominionBlock) => void = () => {}): RunState => {
  let r = edit(started(seed), (b) => {
    b.field.at = 'viridian';
    b.funds = 5000;
    for (const k of ['brawn', 'nerve', 'wits', 'charm', 'stealth'] as const) b.field.edge.stats[k] = 10;
    withHq(b).hq!.rooms.push(room('radio-room'));
    f(b);
  });
  r = go(go(r, { t: 'toNight' }), { t: 'rest' });
  while (blk(r).crew?.talks.length) r = go(r, { t: 'talk', choice: 0 });
  return go(r, { t: 'toDay' });
};
const act = (action: string, target: string | null, district: string): DominionAction => ({ t: 'act', action, target, district, bring: [] });

describe('DOMINION D6b: the data', () => {
  it('nothing waits for D6 any more: actions, tasks, buildings and street rows', () => {
    expect(DOMINION_DATA.actions.actions.filter((a) => actionStatus(a).slice === 'D6')).toHaveLength(0);
    expect(DOMINION_DATA.tasks.filter((t) => t.needs === 'D6')).toHaveLength(0);
    expect(DOMINION_DATA.buildings.filter((b) => b.waits === 'D6')).toHaveLength(0);
    expect(DOMINION_DATA.outside.filter((r) => r.waits === 'D6')).toHaveLength(0);
    expect(actionStatus(actionDef('hold-a-rally')!)).toMatchObject({ play: true, room: 'radio-room' });
    expect(actionStatus(actionDef('chant-night')!).play).toBe(true);
    expect(DOMINION_DATA.tasks.find((t) => t.id === 'pay-the-wages')).toMatchObject({ status: 'supported', effect: { kind: 'wages' } });
  });
  it('every street row of sections A and J has an effect for each of its choices, word for word from the list', () => {
    const rows = DOMINION_DATA.outside.filter((r) => r.section === 'A' || r.section === 'J');
    expect(rows).toHaveLength(50);
    for (const r of rows) {
      expect(r.status, r.id).toBe('supported');
      expect(TW.rows[r.id], r.id).toHaveLength(r.choices.length);
    }
    // The D10 follow-up's sections (B-E, H, I, K) are in the same file: dominionOutside.test.ts checks those.
    expect(Object.keys(TW.rows).filter((id) => 'AJ'.includes(DOMINION_DATA.outside.find((r) => r.id === id)!.section)).sort()).toEqual(rows.map((r) => r.id).sort());
    expect(Object.keys(TW.needs).every((id) => TW.rows[id])).toBe(true);
  });
  it('the fifteen buildings D5 handed over are live; each Regard/Dread one says so in its fx', () => {
    const ids = ['barber-and-uniform-shop', 'trophy-hall', 'ledger-office', 'propaganda-studio', 'press-office', 'emblem-gallery', 'banner-hall', 'charm-school', 'culture-wing', 'fossil-gallery', 'zoo-of-stolen', 'uniform-depot', 'dress-code-wall', 'standard-bearers-hall', 'newsstand'];
    for (const id of ids) {
      const b = DOMINION_DATA.buildings.find((x) => x.id === id)!;
      expect(b.status, id).not.toBe('disabled');
      expect(Object.keys(b.fx).length, id).toBeGreaterThan(0);
    }
    expect(DOMINION_DATA.buildings.find((x) => x.id === 'recruitment-center')!.status).toBe('supported');
  });
});

describe('DOMINION D6b: Hold a Rally and Chant Night', () => {
  it('Hold a Rally needs the Radio Room (failure without it)', () => {
    const r = dayIn('rally-room', (b) => (b.hq!.rooms = []));
    expect(card(blk(r), r, 'hold-a-rally', 'viridian-center', 'viridian')!.blocked).toBeTruthy();
  });
  it('Chant Night stays shut until the first rally, then opens and stays open', () => {
    // Chant Night is a Night action: asked as if it were Night (in Pallet's street), so the rally gate is what answers.
    const atNight = (x: RunState) => card({ ...blk(x), phase: 'night', field: { ...blk(x).field, at: 'pallet' } }, x, 'chant-night', 'pallet-street', 'pallet')!.blocked;
    let r = dayIn('rally');
    expect(atNight(r)).toBe(TW.lines.needRally);
    // The rally, on fresh seeds until one works (a sharp Boss's odds are high).
    let won = false;
    for (let i = 0; i < 6 && !won; i++) {
      r = dayIn(`rally-${i}`);
      const before = (blk(r).crew?.leads ?? []).length;
      r = go(r, act('hold-a-rally', 'viridian-center', 'viridian'));
      won = hasRallied(blk(r));
      if (won) expect((blk(r).crew?.leads ?? []).length).toBeGreaterThan(before);
    }
    expect(won).toBe(true);
    expect(atNight(r)).not.toBe(TW.lines.needRally);
  });
});

describe('DOMINION D6b: Pay the Wages', () => {
  const payday = (f: (b: DominionBlock) => void): DominionBlock => {
    const b = withCrew(structuredClone(blk(started('wages'))));
    b.day = 14;
    f(b);
    runWorldTurn(b, 'wages');
    return b;
  };
  const onWages = (b: DominionBlock, xp: number): void => {
    const m = b.members[0]!;
    m.crew = { ...crewOf(m), task: 'pay-the-wages', taskXp: { ...crewOf(m).taskXp, 'pay-the-wages': xp } };
  };
  it('without a paymaster an unpaid member loses 15 Loyalty (the old rule)', () => {
    const b = payday((x) => {
      x.funds = 0;
      x.members[0]!.loyalty = 50;
    });
    expect(b.members[0]!.loyalty).toBe(35);
  });
  it('Lv 5: no late-pay penalty (boundary: broke on payday)', () => {
    const b = payday((x) => {
      onWages(x, 45);
      x.funds = 0;
      x.members[0]!.loyalty = 50;
    });
    expect(b.members[0]!.unpaid).toBe(1);
    expect(b.members[0]!.loyalty).toBe(50);
  });
  it('Lv 3: wages cost 5% less; Lv 2: Loyalty +1 for the paid', () => {
    const base = payday((x) => (x.funds = 10000));
    const paid = payday((x) => {
      onWages(x, 12);
      x.funds = 10000;
      x.members[0]!.loyalty = 40;
    });
    const wage = paid.members.reduce((a, m) => a + m.wage, 0);
    const cut = paid.members.reduce((a, m) => a + Math.round((m.wage * 95) / 100), 0);
    expect(paid.funds - base.funds).toBe(wage - cut);
    expect(paid.members[0]!.loyalty).toBe(41);
  });
});

describe('DOMINION D6b: buildings and the walk-in', () => {
  it('Regard and Dread buildings work on their district each week; the Ledger Office makes the Card honest', () => {
    const b = withCrew(structuredClone(blk(started('face'))));
    withHq(b).hq!.rooms.push(room('emblem-gallery'), room('culture-wing'), room('ledger-office'));
    const hq = b.field.districts[DOMINION_DATA.field.hq]!;
    const [rg, dr] = [hq.regard, hq.dread];
    b.day = 7;
    hqStep(b);
    expect(hq.regard - rg).toBeGreaterThanOrEqual(2);
    expect(hq.dread - dr).toBeGreaterThanOrEqual(3);
    expect(hqFx(b).honest).toBeGreaterThan(0);
  });
  it('a working Recruitment Center brings a walk-in lead every 7th morning, none on other days', () => {
    const b = withCrew(structuredClone(blk(started('walk'))));
    withHq(b).hq!.rooms.push(room('recruitment-center'));
    b.day = 13;
    const n0 = b.crew!.leads.length;
    runWorldTurn(b, 'walk');
    expect(b.crew!.leads.length).toBe(n0);
    b.day = 14;
    runWorldTurn(b, 'walk');
    expect(b.crew!.leads.length).toBe(n0 + 1);
  });
});

describe('DOMINION D6b: street meetings (sections A and J)', () => {
  /** A block with a meeting waiting (the first seed that rolls one). */
  const withMeet = (row?: string): DominionBlock => {
    const base = withCrew(structuredClone(blk(started('meet'))));
    base.funds = 2000;
    empireOf(base).peak = 1;
    for (let i = 0; i < 400; i++) {
      const out = maybeMeet(base, 'viridian', `meet-${i}`, false);
      if (out.line && (!row || out.block.empire!.meet!.row === row)) return out.block;
    }
    if (row) {
      const b = structuredClone(base);
      Object.assign(empireOf(b), { meet: { row, district: 'viridian', day: b.day }, met: [row], metDay: b.day });
      return b;
    }
    throw new Error('no meeting rolled');
  };
  it('a meeting comes up after an action, shows on the map panel, and only once a day', () => {
    const b = withMeet();
    const m = meetModel(b)!;
    expect(m.choices.length).toBeGreaterThan(1);
    expect(m.district).toBe('Viridian');
    expect(maybeMeet(b, 'viridian', 'again', false).line).toBeNull();
  });
  it('a Nobody meets no one: the town notices you from Street Gang (boundary)', () => {
    const base = withCrew(structuredClone(blk(started('quiet'))));
    base.day = 5;
    expect(base.empire?.peak ?? 0).toBe(0);
    for (let i = 0; i < 200; i++) expect(maybeMeet(base, 'viridian', `q-${i}`, false).line).toBeNull();
  });
  it('the same seed always meets the same row (determinism)', () => {
    const a = withMeet(), b = withMeet();
    expect(a.empire!.meet).toEqual(b.empire!.meet);
  });
  it('answering applies the choice (Return the wallet: Regard +3) and clears the meeting', () => {
    const b = withMeet('O001');
    const rg = b.field.districts.viridian!.regard;
    const out = answerMeet(b, 0, 's');
    expect(out.ok).toBe(true);
    expect(out.block.field.districts.viridian!.regard - rg).toBe(3);
    expect(out.block.empire!.meet).toBeNull();
    expect(meetModel(out.block)).toBeNull();
  });
  it('a choice that costs money is refused when short (failure), and a bad index is refused', () => {
    const b = withMeet('O242');
    b.funds = 100;
    expect(answerMeet(b, 0, 's')).toMatchObject({ ok: false });
    expect(answerMeet(b, 9, 's').ok).toBe(false);
  });
  it('a fight choice leaves a town fight; winning it applies the choice, losing its own cost', () => {
    const b = withMeet('O021');
    const out = answerMeet(b, 0, 's');
    expect(out.fight).toBe(true);
    expect(out.block.field.fight).toMatchObject({ why: 'town', action: 'O021', racket: '0' });
    const lost = structuredClone(out.block);
    settle(content, lost, started('meet'), 'lose', null);
    expect(lost.funds).toBe(out.block.funds - 100);
    expect(lost.field.fight).toBeNull();
    const won = structuredClone(out.block);
    const n0 = won.crew!.leads.length;
    settle(content, won, started('meet'), 'win', null);
    expect(won.crew!.leads.length).toBe(n0 + 1);
  });
  it('rows with needs only come up when met: the wanted poster needs Wanted 20+', () => {
    let seen = false;
    const base = withCrew(structuredClone(blk(started('poster'))));
    empireOf(base).peak = 1;
    for (let i = 0; i < 400; i++) {
      const out = maybeMeet(base, 'viridian', `p-${i}`, false);
      if (out.block.empire?.meet?.row === 'O010') seen = true;
    }
    expect(base.heat).toBeLessThan(20);
    expect(seen).toBe(false);
  });
  it('a waiting meeting survives save/reload; an older save without one loads', () => {
    const b = withMeet('O231');
    expect(DominionBlockSchema.parse(JSON.parse(JSON.stringify(b))).empire!.meet).toEqual(b.empire!.meet);
    const old = structuredClone(b);
    delete old.empire!.meet;
    delete old.empire!.met;
    delete old.empire!.metDay;
    expect(() => DominionBlockSchema.parse(old)).not.toThrow();
  });
  it('the answer goes through the session as a step (saved)', () => {
    const r0 = started('sess');
    const r = edit(r0, (b) => {
      Object.assign(empireOf(b), { meet: { row: 'O003', district: DOMINION_DATA.field.hq, day: b.day }, met: ['O003'], metDay: b.day });
    });
    const out = step(r, { t: 'townMeet', choice: 0 });
    expect(out.ok).toBe(true);
    expect(blk(out.run).empire!.meet).toBeNull();
    expect(step(out.run, { t: 'townMeet', choice: 0 }).ok).toBe(false);
  });
});
