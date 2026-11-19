// DOMINION slice D21: the applications desk (Claude API draft §5.3 B; Rotom mockup k5; BUILD_SLICES.md D21).
import { describe, expect, it } from 'vitest';
import { askClaude, type AskEnv } from '../../src/ai/ask';
import { fakeTransport } from '../../src/ai/client';
import { KeyStore, type KeyValueStore } from '../../src/ai/keyStore';
import { wrapPlayerText } from '../../src/core/ai/rules';
import type { AiLog } from '../../src/core/ai/schema';
import { crewOf } from '../../src/core/dominion/crew';
import { DOMINION_DATA } from '../../src/core/dominion/data';
import {
  ask, clampTyped, current, deskModel, deskStep, deskTalk, DeskReplySchema, inspect, lensText, makeApplicant, misspell, rollQueue, rollTell, stamp, waiting,
} from '../../src/core/dominion/desk';
import { rng } from '../../src/core/dominion/crew';
import { rollCard } from '../../src/core/dominion/personality';
import { DOMINION_MODE_ID, startInRun, stepInRun } from '../../src/core/dominion/session';
import { DominionBlockSchema, type Applicant, type DominionBlock } from '../../src/core/dominion/schema';
import { STANDARD_CHOICE } from '../../src/core/rules';
import { chooseStarter, createRun } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { SaveManager } from '../../src/save/saveManager';
import { MemoryStorageProvider } from '../../src/save/storage';
import { deskView } from '../../src/ui/redux/screens/dominion/desk';
import { content } from './helpers';

const D = DOMINION_DATA.desk;
const domRun = (seed: string): RunState => chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red', rules: { ...STANDARD_CHOICE, modeId: DOMINION_MODE_ID } }), 0);
const blk = (r: RunState): DominionBlock => r.expansion!.dominion!;
function go(r: RunState, ...actions: Parameters<typeof stepInRun>[2][]): RunState {
  for (const a of actions) {
    const out = stepInRun(content, r, a);
    expect(out.ok, `${a.t}: ${out.notice}`).toBe(true);
    r = out.run;
  }
  return r;
}
/** Started and opened: the evening of Day 1. */
function day1(seed = 'd21'): RunState {
  const out = startInRun(content, domRun(seed), { types: ['poison', 'dark'], member: 'grunt', look: 0 });
  expect(out.problem).toBeNull();
  return go(out.run, { t: 'open' });
}
/** The Day phase of Day 2 (the first Day, and the desk's first). */
function day2(seed = 'd21'): RunState {
  return go(day1(seed), { t: 'toNight' }, { t: 'rest' }, { t: 'toDay' });
}
const ui = { mode: 'ask' as const, qAt: 0, fAt: 0, stampAt: null };
/** Many applicants from many seeds (rolled straight, no run steps). */
function many(n: number): Applicant[] {
  const b = blk(day2());
  return Array.from({ length: n }, (_, i) => makeApplicant(content, b, `s${i}`, i + 1));
}

class MapStore implements KeyValueStore {
  m = new Map<string, string>();
  getItem(k: string) { return this.m.get(k) ?? null; }
  setItem(k: string, v: string) { this.m.set(k, v); }
  removeItem(k: string) { this.m.delete(k); }
}

describe('DOMINION D21: the desk data', () => {
  it('is valid: four truths, six fields, every question has all four tells, every species exists', () => {
    expect(D.truths.map((t) => t.id)).toEqual(['honest', 'plant', 'spy', 'glory']);
    expect(D.fields.map((f) => f.id)).toEqual(['home', 'idno', 'badge', 'species', 'levels', 'stamp']);
    for (const q of D.questions) for (const t of ['none', 'nervous', 'contradiction', 'rehearsed'] as const) expect(q.lines[t].length).toBeGreaterThan(0);
    const k = D.regions.kanto!;
    for (const s of [...k.mons, ...k.offRegion]) expect(content.species.has(s), s).toBe(true);
    for (const w of k.writers) expect(k.codes[w.town], w.town).toBeDefined();
    for (const t of DOMINION_DATA.personality.towns.kanto!) expect(k.codes[t], t).toBeDefined();
  });
  it('the player never reads "Claude" or "AI": the data and the screen say Rotom', () => {
    const shown = JSON.stringify({ ...D, rotom: { ...D.rotom, system: '' } });
    expect(shown).not.toMatch(/Claude/);
    expect(shown).not.toMatch(/\bAI\b|\bAi\b/);
    const r = day2();
    const html = deskView(deskModel(blk(r), r.seed, r.ai, new Set()), ui, null);
    expect(html).not.toMatch(/Claude|\bAI\b/);
  });
});

describe('DOMINION D21: the queue', () => {
  it('opens from Day 2 on the Day phase; 2 to 4 applicants; the same seed gives the same queue', () => {
    const r1 = day1();
    expect(blk(r1).desk?.queue.length ?? 0).toBe(0);
    expect(deskModel(blk(r1), r1.seed, r1.ai, new Set()).state).toBe('closed');
    const r = day2();
    const q = blk(r).desk!.queue;
    expect(q.length).toBeGreaterThanOrEqual(D.perDay[0]);
    expect(q.length).toBeLessThanOrEqual(D.perDay[1]);
    expect(waiting(blk(r))).toBe(q.length);
    expect(blk(day2()).desk!.queue).toEqual(q);
    expect(blk(day2('other')).desk!.queue.map((a) => a.name)).not.toEqual(q.map((a) => a.name));
    // Unique names, each person's card is the one rolled from their name.
    expect(new Set(q.map((a) => a.name)).size).toBe(q.length);
    for (const a of q) expect(a.home).toBe((rollCard(r.seed, a.name) as { h: string }).h);
  });
  it('rolling the queue moves nothing else (own stream): the block is the same apart from the desk', () => {
    const r = day2();
    const b = structuredClone(blk(r));
    delete b.desk;
    const again = structuredClone(b);
    expect(rollQueue(content, again, r.seed)).toBe(true);
    delete again.desk;
    expect(again).toEqual(b);
    // Already rolled today: nothing rolls twice.
    const twice = structuredClone(blk(r));
    expect(rollQueue(content, twice, r.seed)).toBe(false);
  });
  it('the paperwork is honest except the planted fields, and every planted field is really wrong', () => {
    const k = D.regions.kanto!;
    const kinds = new Set<string>();
    for (const a of many(300)) {
      const right = (f: string) => !a.miss.includes(f as never);
      if (right('home')) expect(a.homeShown).toBe(a.home); else expect(a.homeShown).not.toBe(a.home);
      expect(a.idNo.endsWith(`-${a.home[0]}`)).toBe(right('idno'));
      if (a.badges) expect(a.badgeAt === a.badges - 1).toBe(right('badge'));
      expect(a.team.some((t) => k.offRegion.includes(t.s))).toBe(!right('species'));
      expect(a.team.some((t) => t.lv > D.levelCaps[a.badges]!)).toBe(!right('levels'));
      expect(a.stamp === k.codes[a.wtown]).toBe(right('stamp'));
      expect(new Set(a.miss).size).toBe(a.miss.length);
      for (const m of a.miss) {
        kinds.add(m);
        expect(lensText(a, m)).not.toBe(D.lens.fine);
      }
      if (a.great) expect(a.miss.every((m) => m === 'home')).toBe(true);
      expect(a.qs).toHaveLength(D.quickPerApplicant);
    }
    expect([...kinds].sort()).toEqual(['badge', 'home', 'idno', 'levels', 'species', 'stamp']);
  });
  it('plants and spies carry more mismatches the less skilled they are; honest recruits rarely any', () => {
    const all = many(400);
    const avg = (xs: Applicant[]) => xs.reduce((s, a) => s + a.miss.length, 0) / Math.max(1, xs.length);
    const crooks = all.filter((a) => a.truth === 'plant' || a.truth === 'spy');
    expect(avg(crooks.filter((a) => a.skill <= 2))).toBeGreaterThan(avg(crooks.filter((a) => a.skill >= 4)));
    expect(avg(all.filter((a) => a.truth === 'honest'))).toBeLessThan(avg(crooks));
    expect(new Set(all.map((a) => a.truth))).toEqual(new Set(['honest', 'plant', 'spy', 'glory']));
  });
  it('misspells one vowel and keeps the rest of the name (boundary: a word with no vowel after the first letter)', () => {
    const r = rng('x', 'misspell');
    const out = misspell('Lavender Town', r);
    expect(out).not.toBe('Lavender Town');
    expect(out.endsWith(' Town')).toBe(true);
    expect(out.length).toBe('Lavender Town'.length);
    expect(misspell('Pyx', rng('y'))).not.toBe('Pyx');
  });
});

describe('DOMINION D21: at the window', () => {
  it('a quick question costs one patience, gives a written answer with a tell, and can\'t be asked twice', () => {
    let r = day2();
    const a = current(blk(r))!;
    r = go(r, { t: 'deskAsk', q: a.qs[0]! });
    const b = current(blk(r))!;
    expect(b.patience).toBe(D.patience - 1);
    expect(b.asked[0]!.tell).toBe(rollTell(r.seed, blk(r).day, a, 0));
    expect(b.asked[0]!.line.length).toBeGreaterThan(5);
    const again = stepInRun(content, r, { t: 'deskAsk', q: a.qs[0]! });
    expect(again.ok).toBe(false);
    expect(again.notice).toBe(D.says.asked);
    expect(stepInRun(content, r, { t: 'deskAsk', q: 'nope' }).ok).toBe(false);
  });
  it('typed questions are clamped, never empty; patience runs out (boundary)', () => {
    let r = day2();
    expect(stepInRun(content, r, { t: 'deskAsk', q: 'typed', text: '   ' }).ok).toBe(false);
    const long = 'x'.repeat(5000);
    r = go(r, { t: 'deskAsk', q: 'typed', text: long });
    expect(current(blk(r))!.asked[0]!.text).toBe(clampTyped(long));
    for (let i = 1; i < D.patience; i++) r = go(r, { t: 'deskAsk', q: 'typed', text: `Question ${i}?` });
    expect(current(blk(r))!.patience).toBe(0);
    const out = stepInRun(content, r, { t: 'deskAsk', q: 'typed', text: 'One more?' });
    expect(out.ok).toBe(false);
    expect(out.notice).toMatch(/enough questions/);
    expect(stepInRun(content, r, { t: 'deskInspect', field: 'home' }).ok).toBe(false);
  });
  it('inspecting a field finds a planted mismatch or says it looks right; never the same field twice', () => {
    let r = day2();
    const a = current(blk(r))!;
    const f = a.miss[0] ?? 'home';
    const out = stepInRun(content, r, { t: 'deskInspect', field: f });
    expect(out.ok).toBe(true);
    expect(out.notice).toContain(a.miss.length ? lensText(a, f) : 'looks right');
    r = out.run;
    expect(stepInRun(content, r, { t: 'deskInspect', field: f }).notice).toBe(D.says.checked);
    expect(stepInRun(content, r, { t: 'deskInspect', field: 'nope' }).ok).toBe(false);
    const m = deskModel(blk(r), r.seed, r.ai, new Set());
    expect(m.found).toBe(a.miss.length ? 1 : 0);
    expect(m.lens!.id).toBe(f);
  });
  it('the desk is shut off the Day phase (failure case)', () => {
    const r = go(day2(), { t: 'endDay' });
    expect(stepInRun(content, r, { t: 'deskAsk', q: 'typed', text: 'Hi' }).notice).toBe(D.says.notDay);
    expect(stepInRun(content, r, { t: 'deskStamp', stamp: 'accept' }).ok).toBe(false);
  });
});

describe('DOMINION D21: stamps', () => {
  it('Accept: they join with their own card and a hidden flag; a great trainer gets the extra trait point', () => {
    let r = day2();
    const a = current(blk(r))!;
    const before = blk(r).members.length;
    const out = stepInRun(content, r, { t: 'deskStamp', stamp: 'accept' });
    expect(out.ok).toBe(true);
    expect(out.notice).toContain(a.name);
    r = out.run;
    const m = blk(r).members.at(-1)!;
    expect(blk(r).members.length).toBe(before + 1);
    expect(m.name).toBe(a.name);
    expect(crewOf(m).card).toEqual(rollCard(r.seed, a.name));
    expect(crewOf(m).flags).toContain(`desk:${a.truth}${a.great ? ':great' : ''}`);
    expect(m.team.length).toBe(1);
    expect(blk(r).desk!.queue[0]!.verdict).toBe('accept');
    expect(blk(r).desk!.log.at(-1)).toMatchObject({ name: a.name, verdict: 'accept' });
    if (['plant', 'spy', 'glory'].includes(a.truth)) expect(blk(r).desk!.watch[0]!.member).toBe(m.id);
  });
  it('Accept with a full HQ is refused (boundary); Reject sends them home', () => {
    let r = day2();
    const full = structuredClone(r);
    blk(full).rosterCap = blk(full).members.length;
    const no = stepInRun(content, full, { t: 'deskStamp', stamp: 'accept' });
    expect(no.ok).toBe(false);
    expect(no.notice).toBe(D.says.full);
    const a = current(blk(r))!;
    r = go(r, { t: 'deskStamp', stamp: 'reject' });
    expect(blk(r).members.some((m) => m.name === a.name)).toBe(false);
    expect(current(blk(r))?.id).not.toBe(a.id);
  });
  it('Detain: Heat goes up now, the basement reveals the truth overnight with its effect', () => {
    let r = day2();
    const a = current(blk(r))!;
    const heat = blk(r).field.districts[DOMINION_DATA.field.hq]!.heat;
    r = go(r, { t: 'deskStamp', stamp: 'detain' });
    expect(blk(r).field.districts[DOMINION_DATA.field.hq]!.heat).toBe(Math.min(100, heat + D.effects.detain.heat));
    expect(blk(r).desk!.held.map((x) => x.id)).toEqual([a.id]);
    r = go(r, { t: 'endDay' }, { t: 'toNight' }, { t: 'rest' });
    expect(blk(r).desk!.held).toEqual([]);
    expect(blk(r).report.some((l) => l.includes(a.name))).toBe(true);
    // The rest of the queue went home without an answer.
    expect(blk(r).report.some((l) => /went home without an answer/.test(l))).toBe(true);
  });
  it('the night: a plant tips the police off, a spy leaks the HQ plan, a glory-seeker quits, each on their day', () => {
    const r = day2();
    const b = structuredClone(blk(r));
    const ids = b.members.slice(0, 1).map((m) => m.id);
    // Three fake recruits watched by the desk, all due tonight.
    for (const [i, truth] of (['plant', 'spy', 'glory'] as const).entries()) {
      const m = structuredClone(b.members[0]!);
      m.id = `x${i}`;
      m.name = `Watch ${truth}`;
      b.members.push(m);
      b.desk!.watch.push({ member: m.id, name: m.name, truth, rival: truth === 'spy' ? 'Team Rocket' : null, due: b.day, done: false });
    }
    const hq = DOMINION_DATA.field.hq;
    const heat = b.field.districts[hq]!.heat, rival = b.field.districts[hq]!.rival;
    const lines = deskStep(b, r.seed);
    expect(b.members.map((m) => m.id)).toEqual([...ids, 'x1']);
    expect(b.field.districts[hq]!.heat).toBe(Math.min(100, heat + D.effects.plant.nightHeat + D.effects.plant.tipHeat));
    expect(b.field.districts[hq]!.rival).toBe(Math.min(100, rival + D.effects.spy.rival));
    expect(b.desk!.leaks).toEqual([{ day: b.day, team: 'Team Rocket', what: 'hq-plan' }]);
    expect(lines.join(' ')).toMatch(/police plant/);
    expect(lines.join(' ')).toMatch(/leaked the HQ plan/);
    expect(lines.join(' ')).toMatch(/quit/);
    expect(b.desk!.watch).toEqual([]);
  });
  it('before their day a plant only warms the HQ district; a member who already left is dropped', () => {
    const b = structuredClone(blk(day2()));
    b.desk!.queue = [];
    b.desk!.watch.push({ member: b.members[0]!.id, name: 'x', truth: 'plant', rival: null, due: b.day + 3, done: false }, { member: 'gone', name: 'y', truth: 'spy', rival: 'Team Rocket', due: b.day, done: false });
    const hq = DOMINION_DATA.field.hq;
    const heat = b.field.districts[hq]!.heat;
    expect(deskStep(b, 's')).toEqual([]);
    expect(b.field.districts[hq]!.heat).toBe(heat + D.effects.plant.nightHeat);
    expect(b.desk!.watch.map((w) => w.member)).toEqual([b.members[0]!.id]);
  });
});

describe('DOMINION D21: Rotom voices the applicant', () => {
  const setup = (answers: Parameters<typeof fakeTransport>[0], key = true) => {
    const keys = new KeyStore(new MapStore(), new MapStore());
    if (key) void keys.set('ruby', 'sk-ant-api03-' + 'x'.repeat(40), false);
    const log: AiLog = {};
    const transport = fakeTransport(answers);
    const env: AskEnv = { tier: 'standard', log, keys, transport };
    return { env, log, transport };
  };
  const asked = (): RunState => go(day2(), { t: 'deskAsk', q: 'typed', text: 'What\'s on the top floor of the tower?' });
  it('the call carries the card, the paperwork, the hidden truth and the rolled tell; typed text is wrapped', () => {
    const r = asked();
    const a = current(blk(r))!;
    const t = deskTalk(blk(r), r.seed, a.id, 0, (x) => wrapPlayerText(x))!;
    expect(t.id).toBe(`desk:${blk(r).day}:${a.id}:0`);
    expect(t.typed).toBe(true);
    expect(t.context).toContain(a.name);
    expect(t.context).toContain('Hidden truth');
    expect(t.input).toContain('<player_text>');
    expect(t.input).toContain(`The tell to show: ${a.asked[0]!.tell}`);
    expect(t.offline).toEqual({ reply: a.asked[0]!.line, tell: a.asked[0]!.tell });
    expect(deskTalk(blk(r), r.seed, a.id, 5, (x) => x)).toBeNull();
  });
  it('the reply and tell are stored in the run, shown with the Rotom chip, and replayed without a second call', async () => {
    const r = asked();
    const a = current(blk(r))!;
    const t = deskTalk(blk(r), r.seed, a.id, 0, (x) => wrapPlayerText(x))!;
    const { env, log, transport } = setup({ desk: JSON.stringify({ reply: 'The radio. Everyone knows.', tell: 'nervous' }) });
    const spec = { id: t.id, role: 'line' as const, use: 'typed' as const, system: t.system, context: t.context, input: t.input, schema: DeskReplySchema, offline: () => t.offline };
    const res = await askClaude(spec, env);
    expect(res.source).toBe('ai');
    const run = { ...r, ai: log };
    const m = deskModel(blk(run), run.seed, run.ai, new Set());
    expect(m.last).toMatchObject({ reply: 'The radio. Everyone knows.', from: 'rotom', tell: { id: 'nervous' } });
    expect(m.last!.chip).toMatch(/^Quick · tell: nervous/);
    const again = await askClaude(spec, env);
    expect(again.source).toBe('stored');
    expect(transport.calls).toHaveLength(1);
    // Survives save and reload.
    const storage = new MemoryStorageProvider();
    new SaveManager(storage, content).saveRun(run);
    const loaded = new SaveManager(storage, content).loadRun();
    expect(loaded.status).toBe('ok');
    if (loaded.status === 'ok') expect(deskModel(blk(loaded.data), loaded.data.seed, loaded.data.ai, new Set()).last!.reply).toBe('The radio. Everyone knows.');
  });
  it('no Key-Card, or a bad answer: the written answer stands and the note says Rotom stays quiet (failure case)', async () => {
    const r = asked();
    const a = current(blk(r))!;
    const t = deskTalk(blk(r), r.seed, a.id, 0, (x) => x)!;
    for (const env of [setup({}, false).env, setup({ desk: '{"reply":"","tell":"sneaky"}' }).env]) {
      const res = await askClaude({ id: t.id, role: 'line', system: t.system, input: t.input, schema: DeskReplySchema, offline: () => t.offline }, env);
      expect(res.source).toBe('offline');
      const m = deskModel(blk(r), r.seed, env.log, new Set());
      expect(m.last).toMatchObject({ reply: a.asked[0]!.line, from: 'offline' });
      expect(m.rotomNote).toBe(D.rotom.off);
    }
    // While the call is out, the bubble says Rotom is listening.
    expect(deskModel(blk(r), r.seed, {}, new Set([t.id])).last!.from).toBe('thinking');
  });
});

describe('DOMINION D21: saves and the screen', () => {
  it('the desk survives save and reload; a save from before D21 (no desk) loads and gets today\'s queue on the next step', () => {
    let r = go(day2(), { t: 'deskInspect', field: 'stamp' });
    const storage = new MemoryStorageProvider();
    new SaveManager(storage, content).saveRun(r);
    const loaded = new SaveManager(storage, content).loadRun();
    expect(loaded.status).toBe('ok');
    if (loaded.status !== 'ok') return;
    expect(blk(loaded.data).desk).toEqual(blk(r).desk);
    const old = structuredClone(r);
    delete blk(old).desk;
    expect(DominionBlockSchema.safeParse(blk(old)).success).toBe(true);
    r = go(old, { t: 'desk' });
    expect(blk(r).desk!.queue.map((a) => a.name)).toEqual(blk(day2()).desk!.queue.map((a) => a.name));
  });
  it('a damaged applicant is refused by the save shape (failure case)', () => {
    const b = structuredClone(blk(day2()));
    (b.desk!.queue[0] as unknown as { truth: string }).truth = 'mole';
    expect(DominionBlockSchema.safeParse(b).success).toBe(false);
  });
  it('the screen shows the paperwork, the questions, the stamps; found mismatches are ringed and counted', () => {
    let r = day2();
    const a = current(blk(r))!;
    for (const f of a.miss) r = go(r, { t: 'deskInspect', field: f });
    const m = deskModel(blk(r), r.seed, r.ai, new Set());
    expect(m.state).toBe('open');
    expect(m.place).toBe(`1 of ${blk(r).desk!.queue.length}`);
    const html = deskView(m, ui, null);
    for (const id of ['desk-id', 'desk-card', 'desk-team', 'desk-letter', 'desk-questions', 'desk-stamp-accept', 'desk-stamp-reject', 'desk-stamp-detain']) expect(html).toContain(`data-testid="${id}"`);
    expect(html).toContain(a.homeShown);
    expect((html.match(/data-found="1"/g) ?? []).length).toBe(a.miss.length);
    if (a.miss.length) expect(html).toContain(`${a.miss.length} MISMATCH`);
    // Stamp everyone: the desk says the queue is empty.
    for (const _ of blk(r).desk!.queue.filter((x) => !x.verdict)) r = go(r, { t: 'deskStamp', stamp: 'reject' });
    const done = deskModel(blk(r), r.seed, r.ai, new Set());
    expect(done.state).toBe('empty');
    expect(deskView(done, ui, null)).toContain('data-testid="desk-closed"');
  });
});
