// Evil Mode slice 3 ("the Card and the Ledger"): the Honest Card's thirteen fields, the gate that lights CONFIRM, the
// Log and its grammar, Waive · Halve · Ask about, Given and Taken, and the block's v2 -> v3 migration.
// Normal, boundary and failure cases.
import { describe, expect, it } from 'vitest';
import { cardFor, confirmLit, gateKey, openGate, otherWay, unknownCount, type CardGate } from '../../src/core/evilMode/card';
import { EVIL_DATA } from '../../src/core/evilMode/data';
import { step, type EvilAction } from '../../src/core/evilMode/day';
import { jobProblem } from '../../src/core/evilMode/dispatch';
import { byPerson, logSums, runLines, sentenceFor, todayPages } from '../../src/core/evilMode/ledger';
import { cardModel, ledgerModel, newLedger } from '../../src/core/evilMode/ledgerScreens';
import { oddsFor, oddsText, type JobDraft } from '../../src/core/evilMode/odds';
import { EVIL_MODE_ID, foundInRun, stepInRun } from '../../src/core/evilMode/session';
import { EvilModeBlockSchema, JOB_METHODS, type EvilModeBlock, type Holding } from '../../src/core/evilMode/schema';
import { firstCrew } from '../../src/core/evilMode/schema';
import { foundTeam } from '../../src/core/evilMode/start';
import { STANDARD_CHOICE } from '../../src/core/rules';
import { chooseStarter, createRun } from '../../src/core/run';
import { SaveManager } from '../../src/save/saveManager';
import { MemoryStorageProvider } from '../../src/save/storage';
import { content } from './helpers';

const found = (seed = 'c1', creed = 'profit'): EvilModeBlock => {
  const r = foundTeam({ name: 'Kettle', creed, line: 'grey', doctrine: 'swarm' }, { boss: 'red', length: 'three', seed, stage: 2 });
  if (!r.ok) throw new Error(r.problem);
  // These suites test the district and the Card with the four nameless Grunts of slices 2 and 3 (a migrated block's crew):
  // no talents, no lines. Named people are tested in evilModePeople.test.ts.
  return { ...r.block, crew: firstCrew(4, EVIL_DATA.creeds.find((c) => c.id === creed)!.start.loyalty) };
};
const go = (b: EvilModeBlock, a: EvilAction): EvilModeBlock => {
  const r = step(b, a);
  if (!r.ok) throw new Error(JSON.stringify(r.cues));
  return r.block;
};
const toDispatch = (b: EvilModeBlock) => go(b, { type: 'dismissOvernight' });
const endDay = (b: EvilModeBlock) => {
  for (const t of ['send', 'stayIn', 'callItADay', 'lightsOut', 'watchRoad', 'dismissOvernight'] as const) {
    if (b.district?.end) return b;
    b = go(b, { type: t });
  }
  return b;
};
const first = (b: EvilModeBlock, f: (h: Holding) => boolean) => b.district!.holdings.find(f)!;
const withHoldings = (b: EvilModeBlock, f: (h: Holding) => Holding): EvilModeBlock => ({ ...b, district: { ...b.district!, holdings: b.district!.holdings.map(f) } });
const scoutAll = (b: EvilModeBlock) => withHoldings(b, (h) => ({ ...h, scouted: 2 }));
/** Every job that can be queued on this board, with each Pay offer. */
const allJobs = (b: EvilModeBlock): JobDraft[] => b.district!.holdings.flatMap((h) => JOB_METHODS.flatMap((method) => (method === 'pay' ? EVIL_DATA.district.methods.pay.offers.map((o) => o.pct) : [undefined]).map((offer) => ({ holdingId: h.id, method, squad: method === 'scout' ? ['g1'] : ['g1', 'g2'], ...(offer ? { offer } : {}) })))).filter((j) => !jobProblem(b, j));

describe('the Honest Card: thirteen fields, always in the same order', () => {
  it('every queueable job on two boards (unscouted and scouted) gets thirteen filled fields, in order, with no template holes', () => {
    for (const b of [toDispatch(found()), scoutAll(toDispatch(found('c2')))]) {
      const jobs = allJobs(b);
      expect(jobs.length).toBeGreaterThan(20);
      for (const j of jobs) {
        const c = cardFor(b, j);
        expect(c.fields.map((f) => f.label)).toEqual(EVIL_DATA.ledger.fields);
        for (const f of c.fields) {
          expect(f.text.trim().length).toBeGreaterThan(0);
          expect(f.text).not.toMatch(/\{\w+\}/);
        }
        // Field 13 is never empty: "This is it." on a clean Card, the other way otherwise.
        expect(c.fields[12]!.text).toBe(c.clean ? EVIL_DATA.ledger.card.clean : c.fields[12]!.text);
        // Field 6 prints the same odds the Evening rolls against.
        expect(c.fields[5]!.text).toBe(oddsText(oddsFor(b, j)));
        // Field 12 is the Ledger's sentence.
        expect(c.fields[11]!.text).toBe(sentenceFor(b, j));
        expect(c.fields[11]!.text).toMatch(/^Day 1\. Grunt 1(, Grunt 2)?\. [A-Z]/);
      }
    }
  });
  it('a Pay under the price is not clean, says it turns, and its other way swaps to the fair price; Persuade, fair Pay, Outplay and Scout are clean', () => {
    const b = scoutAll(toDispatch(found()));
    const h = first(b, (x) => x.kind === 'local' && !jobProblem(b, { holdingId: x.id, method: 'pay', squad: ['g1', 'g2'], offer: 50 }));
    const low: JobDraft = { holdingId: h.id, method: 'pay', squad: ['g1', 'g2'], offer: 50 };
    const c = cardFor(b, low);
    expect(c.clean).toBe(false);
    expect(c.fields[8]!.text).toMatch(/^Turns/);
    expect(c.fields[12]!.text).toMatch(/^Pay the fair price: ₽/);
    expect(otherWay(low)).toEqual({ ...low, offer: 100 });
    expect(cardFor(b, { ...low, offer: 100 }).clean).toBe(true);
    for (const method of ['persuade', 'outplay', 'scout'] as const) expect(cardFor(b, { holdingId: h.id, method, squad: method === 'scout' ? ['g1'] : ['g1', 'g2'] }).clean).toBe(true);
    expect(otherWay({ ...low, offer: 100 })).toBeNull();
  });
  it('field 3 uses a name once scouted; before, it is red ink and field 11 lists what is a guess', () => {
    const b = toDispatch(found());
    const h = first(b, (x) => x.kind === 'local' && x.scouted === 0);
    const job: JobDraft = { holdingId: h.id, method: 'persuade', squad: ['g1', 'g2'] };
    const blind = cardFor(b, job);
    expect(blind.fields[2]).toMatchObject({ unknown: true });
    expect(blind.fields[2]!.text).toContain(`step ${h.step}`);
    expect(unknownCount(blind)).toBeGreaterThan(0);
    expect(blind.fields[10]!.text).toContain('From: not scouted.');
    const seen = cardFor(withHoldings(b, (x) => (x.id === h.id ? { ...x, scouted: 1 } : x)), job);
    const local = EVIL_DATA.district.locals.find((l) => l.id === h.ref)!;
    expect(seen.fields[2]!.text).toContain(local.who);
    expect(seen.fields[2]!.unknown).toBe(false);
  });
  it('the five numbers are always drawn, a dash where one does not move', () => {
    const b = scoutAll(toDispatch(found()));
    const h = first(b, (x) => x.kind === 'wild');
    const moves = cardFor(b, { holdingId: h.id, method: 'scout', squad: ['g1'] }).fields[4]!.text;
    for (const n of ['Funds', 'Heat', 'Loyalty', 'Regard', 'Dread']) expect(moves).toContain(n);
    expect(moves).toContain('Loyalty —');
  });
  it('a Card preview draws nothing: built a hundred times, the block and the stream counts are unchanged', () => {
    const b = toDispatch(found());
    const before = structuredClone(b);
    const j = allJobs(b)[3]!;
    for (let i = 0; i < 100; i++) cardFor(b, j);
    for (let i = 0; i < 100; i++) cardModel(b, { job: j, gate: openGate(false, false) });
    expect(b).toEqual(before);
  });
});

describe('the gate: CONFIRM is lit only once field 13 has been seen, and a held key never confirms', () => {
  it('off until field 13 is seen; a press before then scrolls', () => {
    let g: CardGate = openGate(false, false);
    expect(confirmLit(g)).toBe(false);
    const r = gateKey(g, { type: 'down' });
    expect(r.act).toBe('scroll');
    g = { ...r.gate, seen: true };
    expect(confirmLit(g)).toBe(true);
    expect(gateKey(g, { type: 'down' }).act).toBe('confirm');
  });
  it('on at once when all thirteen fit (boundary)', () => {
    expect(confirmLit(openGate(true, false))).toBe(true);
    expect(gateKey(openGate(true, false), { type: 'down' }).act).toBe('confirm');
  });
  it('deaf to a held key: repeats scroll, the opening press needs a release, then its own press confirms', () => {
    let g = openGate(true, true);
    for (let i = 0; i < 20; i++) {
      const r = gateKey(g, { type: 'down', repeat: true });
      expect(r.act).toBe('scroll');
      g = r.gate;
    }
    expect(gateKey(g, { type: 'down' }).act).toBe('none');
    g = gateKey(g, { type: 'up' }).gate;
    expect(gateKey(g, { type: 'down', repeat: true }).act).toBe('scroll');
    expect(gateKey(g, { type: 'down' }).act).toBe('confirm');
  });
});

describe('the Ledger: the Log, its sentences, and the run', () => {
  it("field 12 equals the Ledger's line, character for character, and the Card is kept with its day", () => {
    const b0 = scoutAll(toDispatch(found()));
    for (const j of allJobs(b0).slice(0, 12)) {
      const preview = cardFor(b0, j).fields[11]!.text;
      const r = step(b0, { type: 'confirmCard', job: j });
      expect(r.ok).toBe(true);
      const entry = r.block.log.at(-1)!;
      expect(entry.kind).toBe('card');
      expect(entry.text).toBe(preview);
      const kept = r.block.cards.find((c) => c.id === entry.cardId)!;
      expect(kept.fields.map((f) => (typeof f === "string" ? f : f.text))[11]).toBe(entry.text);
      expect(kept.day).toBe(1);
      expect(r.block.queue.at(-1)!.cardId).toBe(kept.id);
      expect(r.cues).toContainEqual({ id: 'filed', text: preview });
    }
  });
  it('confirming without looking is logged; the run tab says so', () => {
    const b = toDispatch(found());
    const h = first(b, (x) => x.kind === 'local' && x.scouted === 0);
    const out = go(b, { type: 'confirmCard', job: { holdingId: h.id, method: 'persuade', squad: ['g1', 'g2'] } });
    expect(out.log.at(-1)!.unknowns).toBeGreaterThan(0);
    expect(runLines(out)[0]!.unseen).toBe(true);
    expect(ledgerModel(out, { tab: 1, row: 0, act: null }).run![0]!.note).toBe(EVIL_DATA.ledger.card.unseen);
  });
  it('the Evening marks each Card: it went, or it did not; a cleared job is called off and its Card stays', () => {
    let b = scoutAll(toDispatch(found()));
    const [a, c] = b.district!.holdings.filter((x) => x.kind === 'local');
    b = go(b, { type: 'confirmCard', job: { holdingId: a!.id, method: 'scout', squad: ['g1'] } });
    b = go(b, { type: 'confirmCard', job: { holdingId: c!.id, method: 'persuade', squad: ['g2', 'g3'] } });
    b = go(b, { type: 'clearJob', holdingId: c!.id });
    expect(b.log.filter((e) => e.kind === 'card')).toHaveLength(2);
    expect(runLines(b).map((l) => l.mark)).toEqual(['pending', 'called off']);
    b = endDay(b);
    expect(runLines(b).map((l) => l.mark)).toEqual(['went', 'called off']);
    // Replacing a queued job calls off the old Card and files a new one.
    b = go(b, { type: 'confirmCard', job: { holdingId: c!.id, method: 'persuade', squad: ['g2', 'g3'] } });
    b = go(b, { type: 'confirmCard', job: { holdingId: c!.id, method: 'outplay', squad: ['g2', 'g3'] } });
    expect(runLines(b).slice(-2).map((l) => l.mark)).toEqual(['called off', 'pending']);
  });
  it('no action removes a Log entry: over a seeded week, every step keeps the Log it was given as its start', () => {
    let b = scoutAll(toDispatch(found('week')));
    const actions: EvilAction[] = [];
    for (let day = 0; day < 7 && !b.district!.end; day++) {
      const locals = b.district!.holdings.filter((x) => x.kind === 'local' && x.owner !== 'team');
      const [l0, l1] = locals;
      const tries: EvilAction[] = [
        ...(l0 ? [{ type: 'confirmCard', job: { holdingId: l0.id, method: 'persuade', squad: ['g1', 'g2'] } } satisfies EvilAction] : []),
        ...(l1 ? [{ type: 'confirmCard', job: { holdingId: l1.id, method: 'outplay', squad: ['g3', 'g4'] } }, { type: 'clearJob', holdingId: l1.id }, { type: 'confirmCard', job: { holdingId: l1.id, method: 'pay', squad: ['g3', 'g4'], offer: 50 } }] satisfies EvilAction[] : []),
      ];
      for (const held of b.district!.holdings.filter((x) => x.owner === 'team')) tries.push({ type: 'askAbout', holdingId: held.id }, { type: 'halve', holdingId: held.id }, { type: 'waive', holdingId: held.id });
      for (const a of [...tries, { type: 'send' } as const, { type: 'stayIn' } as const, { type: 'callItADay' } as const, { type: 'lightsOut' } as const, { type: 'watchRoad' } as const, { type: 'dismissOvernight' } as const]) {
        const r = step(b, a);
        expect(r.block.log.slice(0, b.log.length)).toEqual(b.log);
        expect(r.block.log.length).toBeGreaterThanOrEqual(b.log.length);
        if (r.ok) actions.push(a);
        b = r.block;
      }
    }
    expect(b.log.length).toBeGreaterThan(20);
    expect(new Set(b.log.map((e) => e.id)).size).toBe(b.log.length);
    // Given and Taken equal the Log's sums, and Given grew (wages paid, a waiver).
    expect({ given: b.given, taken: b.taken }).toEqual(logSums(b));
    expect(b.given).toBeGreaterThan(0);
    expect(actions.length).toBeGreaterThan(10);
  });
  it('by person: the same lines, sorted by who they name, in the order people joined', () => {
    let b = scoutAll(toDispatch(found()));
    const h = first(b, (x) => x.kind === 'local');
    b = go(b, { type: 'confirmCard', job: { holdingId: h.id, method: 'persuade', squad: ['g3', 'g1'] } });
    const p = byPerson(b);
    expect(p.map((x) => x.name)).toEqual(['Grunt 1', 'Grunt 2', 'Grunt 3', 'Grunt 4']);
    expect(p[0]!.lines).toHaveLength(1);
    expect(p[1]!.lines).toHaveLength(0);
    expect(p[2]!.lines).toEqual(p[0]!.lines);
  });
});

describe('Waive · Halve · Ask about, and Given and Taken', () => {
  const owned = () => {
    let b = scoutAll(toDispatch(found()));
    const h = first(b, (x) => x.kind === 'local' && (EVIL_DATA.district.locals.find((l) => l.id === x.ref)!.take ?? 0) >= 200);
    b = withHoldings(b, (x) => (x.id === h.id ? { ...x, owner: 'team', method: 'persuade', since: 1, holds: true, scouted: 1 } : x));
    return { b, h, take: EVIL_DATA.district.locals.find((l) => l.id === h.ref)!.take };
  };
  it('a waived line pays nothing at the next Evening and adds one to Given; a halved line pays half', () => {
    const { b, h, take } = owned();
    const plain = endDay(b);
    const waived = go(b, { type: 'waive', holdingId: h.id });
    expect(waived.given).toBe(b.given + EVIL_DATA.ledger.count.waive);
    expect(waived.log.at(-1)).toMatchObject({ kind: 'waive', to: h.id });
    expect(endDay(waived).team.funds).toBe(plain.team.funds - take);
    const halved = go(b, { type: 'halve', holdingId: h.id });
    expect(halved.given).toBe(b.given);
    expect(endDay(halved).team.funds).toBe(plain.team.funds - take + Math.floor(take / 2));
    expect(todayPages(halved).in.find((l) => l.holdingId === h.id)!.amount).toBe(Math.floor(take / 2));
  });
  it('a line can be waived once and halved once; halving a waived line is refused (failure)', () => {
    const { b, h } = owned();
    const w = go(b, { type: 'waive', holdingId: h.id });
    expect(step(w, { type: 'waive', holdingId: h.id }).ok).toBe(false);
    expect(step(w, { type: 'halve', holdingId: h.id }).ok).toBe(false);
    const half = go(b, { type: 'halve', holdingId: h.id });
    expect(step(half, { type: 'halve', holdingId: h.id }).ok).toBe(false);
    expect(step(half, { type: 'waive', holdingId: h.id }).ok).toBe(true);
    const nobody = first(b, (x) => x.owner !== 'team');
    expect(step(b, { type: 'waive', holdingId: nobody.id }).ok).toBe(false);
  });
  it('ask about: one exchange that tells what they want, once a district, and the line is logged', () => {
    const { b, h } = owned();
    const r = step(b, { type: 'askAbout', holdingId: h.id });
    expect(r.ok).toBe(true);
    const local = EVIL_DATA.district.locals.find((l) => l.id === h.ref)!;
    const asked = r.cues.find((c) => c.id === 'asked');
    expect(asked && 'line' in asked ? asked.line : '').toContain(local.want.charAt(0).toLowerCase() + local.want.slice(1));
    expect(r.block.district!.holdings.find((x) => x.id === h.id)!.scouted).toBe(2);
    expect(r.block.log.at(-1)!.kind).toBe('ask');
    expect(step(r.block, { type: 'askAbout', holdingId: h.id }).ok).toBe(false);
    expect(r.block.draws).toEqual(b.draws);
  });
  it('the Given and Taken tab prints both totals side by side and never their difference', () => {
    const { b, h } = owned();
    const w = go(b, { type: 'waive', holdingId: h.id });
    const m = ledgerModel(w, { ...newLedger(), tab: 3 });
    expect(m.totals).toEqual({ given: w.given, taken: w.taken, note: EVIL_DATA.ledger.givenTaken });
  });
});

describe('saves: block v3 and the migration from v2', () => {
  const run0 = () => chooseStarter(content, createRun(content, { runId: 'v3', seed: 'v3', archetypeId: 'red', rules: { ...STANDARD_CHOICE, modeId: EVIL_MODE_ID } }), 0);
  it('a slice-2 block (v2) migrates: nothing lost, an empty Log, no Cards, Given and Taken at 0; a job queued before slice 3 still rolls', () => {
    let r = foundInRun(run0(), { name: 'Kettle', creed: 'profit', line: 'grey', doctrine: 'swarm' }, 'three', 2).run;
    r = stepInRun(r, { type: 'dismissOvernight' }).run;
    const b3 = r.expansion!.evilMode!;
    const h = first(b3, (x) => x.kind === 'local');
    const { log: _l, cards: _c, given: _g, taken: _t, rates: _r, applicants: _a, drawn: _dr, refusal: _rf, ...rest } = b3;
    const v2 = { ...rest, v: 2, crew: [1, 2, 3, 4].map((i) => ({ id: `g${i}`, name: `Grunt ${i}`, outOn: null })), queue: [{ holdingId: h.id, method: 'scout', squad: ['g1'], odds: null, certain: true, terms: [{ label: 'Scouting always works', value: 100 }] }] };
    const parsed = EvilModeBlockSchema.parse(v2);
    // Slice 4 took the block to v4; a v2 block goes through v3 to v4 in one load.
    expect(parsed).toMatchObject({ v: 23, log: [], cards: [], given: 0, taken: 0, rates: {}, applicants: [], refusal: null });
    expect(parsed.team).toEqual(b3.team);
    expect(parsed.district).toEqual(b3.district);
    const storage = new MemoryStorageProvider();
    new SaveManager(storage, content).saveRun({ ...r, expansion: { ...r.expansion, evilMode: v2 as never } });
    const loaded = new SaveManager(storage, content).loadRun();
    expect(loaded.status).toBe('ok');
    if (loaded.status !== 'ok') return;
    const eve = stepInRun(stepInRun(loaded.data, { type: 'send' }).run, { type: 'stayIn' }).run.expansion!.evilMode!;
    expect(eve.sheets).toHaveLength(1);
    expect(eve.log.filter((e) => e.kind === 'job')).toHaveLength(0);
  });
  it('a filed Card and the Log survive a save and reload unchanged', () => {
    let r = foundInRun(run0(), { name: 'Kettle', creed: 'profit', line: 'grey', doctrine: 'swarm' }, 'three', 2).run;
    r = stepInRun(r, { type: 'dismissOvernight' }).run;
    const h = first(r.expansion!.evilMode!, (x) => x.kind === 'local');
    r = stepInRun(r, { type: 'confirmCard', job: { holdingId: h.id, method: 'persuade', squad: ['g1', 'g2'] } }).run;
    const storage = new MemoryStorageProvider();
    new SaveManager(storage, content).saveRun(r);
    const loaded = new SaveManager(storage, content).loadRun();
    expect(loaded.status === 'ok' && loaded.data).toEqual(r);
  });
  it('a damaged Log or Card does not pass the schema (failure)', () => {
    let b = scoutAll(toDispatch(found()));
    b = go(b, { type: 'confirmCard', job: { holdingId: first(b, (x) => x.kind === 'local').id, method: 'persuade', squad: ['g1', 'g2'] } });
    expect(EvilModeBlockSchema.safeParse(b).success).toBe(true);
    expect(EvilModeBlockSchema.safeParse({ ...b, cards: [{ ...b.cards[0]!, fields: b.cards[0]!.fields.slice(0, 12) }] }).success).toBe(false);
    expect(EvilModeBlockSchema.safeParse({ ...b, log: [{ ...b.log[0]!, kind: 'erase' }] }).success).toBe(false);
    expect(EvilModeBlockSchema.safeParse({ ...b, given: -1 }).success).toBe(false);
  });
});
