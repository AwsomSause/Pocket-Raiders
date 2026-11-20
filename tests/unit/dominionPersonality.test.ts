// DOMINION slice D19: personality cards (Claude API draft §5.3 A; Rotom mockup a3; BUILD_SLICES.md D19).
import { describe, expect, it } from 'vitest';
import { crewOf, crewStep, memberLine, modsOf, odds, taskById, withCrew } from '../../src/core/dominion/crew';
import { leadsModel, personaModel } from '../../src/core/dominion/crewScreens';
import { DOMINION_DATA } from '../../src/core/dominion/data';
import { canonCard, cardFor, cardLine, cardPrompt, fillCards, lineKind, rollCard, sheet, traitWords, voice } from '../../src/core/dominion/personality';
import { makeLead } from '../../src/core/dominion/recruit';
import { DOMINION_MODE_ID, startInRun, stepInRun } from '../../src/core/dominion/session';
import { DominionBlockSchema, type Card, type DominionBlock, type Member } from '../../src/core/dominion/schema';
import { STANDARD_CHOICE } from '../../src/core/rules';
import { chooseStarter, createRun } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { SaveManager } from '../../src/save/saveManager';
import { MemoryStorageProvider } from '../../src/save/storage';
import { personaView } from '../../src/ui/redux/screens/dominion/persona';
import { content } from './helpers';

const P = DOMINION_DATA.personality;
const domRun = (seed: string): RunState => chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red', rules: { ...STANDARD_CHOICE, modeId: DOMINION_MODE_ID } }), 0);
const started = (seed = 'd19', member: 'grunt' | 'admin' = 'grunt'): RunState => {
  const out = startInRun(content, domRun(seed), { types: ['poison', 'dark'], member, look: 0 });
  expect(out.problem).toBeNull();
  return stepInRun(content, out.run, { t: 'open' }).run;
};
const blk = (r: RunState): DominionBlock => r.expansion!.dominion!;
const card = (a: string, b: string): Card => ({ t: [a, b], q: 'listen', w: 'x', f: 'y', h: 'Pallet Town' });
/** A block with Rook and a second member, everyone resting, Loyalty 50. */
function two(r = started()): DominionBlock {
  const b = withCrew(blk(r));
  const m2: Member = structuredClone(b.members[0]!);
  m2.id = 'm2';
  m2.name = 'Gus';
  delete m2.crew!.card;
  b.members.push(m2);
  for (const m of b.members) {
    crewOf(m).task = 'rest';
    m.loyalty = 50;
    m.morale = 50;
  }
  return b;
}

describe('DOMINION D19: the card data', () => {
  it('a fixed list of traits, each with two effects and all five line kinds; 24 quirks; wants, fears; towns for nine regions', () => {
    expect(P.traits.length).toBe(12);
    expect(new Set(P.traits.map((t) => t.id)).size).toBe(12);
    for (const t of P.traits) {
      expect(t.effects).toHaveLength(2);
      for (const k of ['hello', 'done', 'fail', 'scared', 'pay'] as const) expect(P.lines[t.id]![k].length).toBeGreaterThan(0);
      // Each effect either works now (a live rule) or names the slice that turns it on.
      for (const e of t.effects) expect(!!(e.mods || e.squadMor || e.payLoy || e.unpaidLoy) !== !!e.needs).toBe(true);
    }
    expect(P.quirks).toHaveLength(24);
    expect(P.wants.length).toBeGreaterThanOrEqual(30);
    expect(P.fears.length).toBeGreaterThanOrEqual(30);
    expect(Object.keys(P.towns)).toHaveLength(9);
  });
  it('the player never reads "Claude" or "AI": the data and the screen say Rotom', () => {
    const json = JSON.stringify(P);
    expect(json).not.toMatch(/Claude/);
    expect(json).not.toMatch(/\bAI\b|\bAi\b/);
    const html = personaView(personaModel(blk(started()), 0, 'd19'), () => null);
    expect(html).toContain('ROTOM LINE');
    expect(html.replace(/<[^>]*>/g, ' ')).not.toMatch(/Claude|\bAI\b|\bAi\b/);
  });
});

describe('DOMINION D19: rolling a card', () => {
  it('same seed and name = same card; the two traits never match or clash; the home town is in the run region', () => {
    const a = rollCard('s1', 'Gus');
    expect(rollCard('s1', 'Gus')).toEqual(a);
    const kanto = P.towns.kanto!;
    const seen = new Set<string>();
    for (let i = 0; i < 200; i++) {
      const c = rollCard('s1', `Grunt ${i}`) as Extract<Card, { t: unknown }>;
      expect(c.t[0]).not.toBe(c.t[1]);
      expect(P.clash.some(([x, y]) => (x === c.t[0] && y === c.t[1]) || (x === c.t[1] && y === c.t[0]))).toBe(false);
      expect(kanto).toContain(c.h);
      seen.add(c.t.join('+'));
    }
    // Enough variety that a crew rarely repeats a pair.
    expect(seen.size).toBeGreaterThan(50);
    // A different run gives the same name a different card (boundary: seed matters).
    expect([1, 2, 3, 4, 5].some((i) => JSON.stringify(rollCard(`s${i + 1}`, 'Gus')) !== JSON.stringify(a))).toBe(true);
    // Another region's towns when asked.
    expect(P.towns.johto).toContain((rollCard('s1', 'Gus', 'johto') as { h: string }).h);
  });
  it('Bosses use their canon sheet; an unknown Boss has none', () => {
    const g = sheet(canonCard('giovanni')!);
    expect(g.canon).toEqual({ id: 'giovanni', name: 'Giovanni', team: 'Team Rocket' });
    expect(g.traits.map((t) => t.id)).toEqual(['proud', 'schemer']);
    expect(g.home).toBe('Viridian City');
    expect(canonCard('nobody')).toBeNull();
    for (const id of Object.keys(P.canon)) expect(() => sheet({ canon: id })).not.toThrow();
    expect(cardPrompt('Giovanni', 'Boss', canonCard('giovanni')!)).toContain('Boss of Team Rocket');
  });
  it('a card with a trait or quirk id no longer in the data still reads (failure case: falls back, never throws)', () => {
    const s = sheet({ t: ['gone', 'greedy'], q: 'gone', w: 'w', f: 'f', h: 'h' });
    expect(s.traits[0]!.id).toBe(P.traits[0]!.id);
    expect(s.traits[1]!.id).toBe('greedy');
    expect(s.quirk.id).toBe(P.quirks[0]!.id);
  });
  it('applicants and enemy grunts get a card from their name: the lead keeps the same card when they join', () => {
    const r = started();
    const b = withCrew(blk(r));
    const lead = makeLead(b, b.members[0]!, r.seed);
    expect(lead).toBeTruthy();
    const rows = leadsModel(b, r.seed).rows;
    expect(rows.at(-1)!.traits).toBe(traitWords(rollCard(r.seed, lead!.name)));
    expect(cardFor(r.seed, { name: lead!.name })).toEqual(rollCard(r.seed, lead!.name));
    expect(leadsModel(b).rows.at(-1)!.traits).toBeNull();
  });
});

describe('DOMINION D19: offline lines read the card', () => {
  it('the speech quirk: a comma prefix goes on in lower case but keeps "I"; swaps, endings and shouting', () => {
    const q = (id: string) => P.quirks.find((x) => x.id === id)!;
    expect(voice(q('listen'), "Job's done.")).toBe("Listen, job's done.");
    expect(voice(q('listen'), 'I ran.')).toBe('Listen, I ran.');
    expect(voice(q('capisce'), "Job's done, Boss. Pay's fair.")).toBe("Job's done, Boss. Pay's fair. Capisce?");
    expect(voice(q('chief'), 'Done, Boss.')).toBe('Done, Chief.');
    expect(voice(q('shout'), 'Done!')).toBe('DONE!');
  });
  it('the line follows last night (done, fail, caught, pay) and the traits take turns by day', () => {
    expect(lineKind('success')).toBe('done');
    expect(lineKind('big')).toBe('done');
    expect(lineKind('fail')).toBe('fail');
    expect(lineKind('arrested')).toBe('scared');
    expect(lineKind('pay')).toBe('pay');
    expect(lineKind('none')).toBe('hello');
    const c: Card = { t: ['greedy', 'joker'], q: 'capisce', w: 'w', f: 'f', h: 'h' };
    expect(cardLine(c, 'done', 0)).toBe(`${P.lines.greedy!.done[0]} Capisce?`);
    expect(cardLine(c, 'done', 1)).toBe(`${P.lines.joker!.done[0]} Capisce?`);
    expect(cardLine(c, 'done', 2)).toBe(`${P.lines.greedy!.done[1]} Capisce?`);
  });
  it('every member line on the Crew File carries their quirk', () => {
    const b = withCrew(blk(started()));
    const m = b.members[0]!;
    crewOf(m).card = card('loyal', 'kind');
    expect(memberLine(m, 3).startsWith('Listen, ')).toBe(true);
  });
});

describe('DOMINION D19: traits are live rules (pay, Morale, danger)', () => {
  it('Hothead: +10 on Brawn jobs; the D22 effects (bribes, spies) are not live yet', () => {
    const b = two();
    const m = b.members[0]!;
    const task = taskById('guard-hq')!;
    expect(task.stat).toBe('brawn');
    crewOf(m).card = card('loyal', 'kind');
    const base = odds(b, m, task);
    crewOf(m).card = card('hothead', 'loyal');
    expect(odds(b, m, task)).toBe(base + 10);
    crewOf(m).card = card('greedy', 'gossip');
    expect(modsOf(b, m).some((x) => x.pct === 10 && x.stat === 'wits')).toBe(true);
    expect(modsOf(b, m)).toHaveLength(1); // Greedy's and Gossip's D22 effects wait.
  });
  it('Schemer caps Loyalty at 80; Loyal keeps it at 30 or more (boundary)', () => {
    const b = two();
    const [a, g] = b.members as [Member, Member];
    crewOf(a).card = card('schemer', 'joker');
    crewOf(g).card = card('loyal', 'gossip');
    a.loyalty = 95;
    g.loyalty = 5;
    crewStep(b, 'd19');
    expect(a.loyalty).toBe(80);
    expect(g.loyalty).toBe(30);
  });
  it('a Joker lifts everyone else +1 Morale a night, once however many Jokers', () => {
    const b = two();
    const [a, g] = b.members as [Member, Member];
    crewOf(a).card = card('joker', 'loyal');
    crewOf(g).card = card('kind', 'loyal');
    const ref = two();
    crewOf(ref.members[0]!).card = card('loyal', 'gossip');
    crewOf(ref.members[1]!).card = card('loyal', 'gossip');
    const lines = crewStep(b, 'd19');
    crewStep(ref, 'd19');
    expect(g.morale).toBe(ref.members[1]!.morale + 1);
    expect(a.morale).toBe(ref.members[0]!.morale);
    expect(lines.some((l) => l.includes('kept the crew'))).toBe(true);
  });
  it('pay day: Greedy gets Loyalty ×2 for pay; unpaid, a Proud member loses 15 more and a Zealot 10 less', () => {
    const mk = (a: string, b2: string, unpaid: number) => {
      const b = two();
      b.day = 8;
      for (const m of b.members) {
        crewOf(m).card = card(a, b2);
        crewOf(m).motive = 'money';
        m.unpaid = unpaid;
      }
      crewStep(b, 'd19');
      return b.members[0]!.loyalty;
    };
    const plain = mk('loyal', 'gossip', 0);
    const R = DOMINION_DATA.crew.rules;
    expect(mk('greedy', 'loyal', 0) - plain).toBe(R.moneyLoyalty);
    const unpaidPlain = mk('loyal', 'gossip', 1);
    expect(mk('proud', 'loyal', 1)).toBe(Math.max(30, unpaidPlain - 15));
    expect(mk('zealot', 'gossip', 1)).toBe(Math.min(100, Math.max(40, unpaidPlain + 10)));
  });
  it('the night is the same every time with cards (determinism)', () => {
    const a = two();
    const b2 = two();
    crewStep(a, 'd19');
    crewStep(b2, 'd19');
    expect(a).toEqual(b2);
  });
});

describe('DOMINION D19: saves', () => {
  it('every member has a card from the start; it survives save and reload unchanged', () => {
    const r = started('d19', 'admin');
    for (const m of blk(r).members) expect(m.crew!.card).toEqual(rollCard(r.seed, m.name));
    const storage = new MemoryStorageProvider();
    new SaveManager(storage, content).saveRun(r);
    const loaded = new SaveManager(storage, content).loadRun();
    expect(loaded.status).toBe('ok');
    if (loaded.status !== 'ok') return;
    expect(blk(loaded.data).members.map((m) => m.crew!.card)).toEqual(blk(r).members.map((m) => m.crew!.card));
  });
  it('a D3 save (members without a card) loads, and the next step gives each the same card it would have had', () => {
    const r = started();
    const old = structuredClone(r);
    for (const m of blk(old).members) delete m.crew!.card;
    const storage = new MemoryStorageProvider();
    new SaveManager(storage, content).saveRun(old);
    const loaded = new SaveManager(storage, content).loadRun();
    expect(loaded.status).toBe('ok');
    if (loaded.status !== 'ok') return;
    expect(blk(loaded.data).members[0]!.crew!.card).toBeUndefined();
    // The screen already shows the card it will get.
    expect(personaModel(blk(loaded.data), 0, loaded.data.seed).traits.map((t) => t.name)).toEqual(sheet(blk(r).members[0]!.crew!.card!).traits.map((t) => t.name));
    const next = stepInRun(content, loaded.data, { t: 'toNight' });
    expect(next.ok).toBe(true);
    expect(blk(next.run).members[0]!.crew!.card).toEqual(blk(r).members[0]!.crew!.card);
  });
  it('a damaged card is refused by the save shape (failure case)', () => {
    const b = structuredClone(blk(started()));
    (b.members[0]!.crew as unknown as { card: unknown }).card = { t: ['loyal'], q: 1 };
    expect(DominionBlockSchema.safeParse(b).success).toBe(false);
    expect(fillCards(structuredClone(blk(started())), 'd19').members[0]!.crew!.card).toBeDefined();
  });
});

describe('DOMINION D19: the card on the Crew File (mockup a3)', () => {
  it('shows two traits, the quirk, want, fear, home town, what the traits do, the memory of this run and the others on file', () => {
    const b = two();
    b.members[0]!.crew!.card = { t: ['greedy', 'joker'], q: 'capisce', w: 'A corner office with a window', f: "Officer Jenny's Growlithe", h: 'Celadon City' };
    b.members[0]!.crew!.memory = [1, 2, 3, 4].map((day) => ({ day, line: `memory ${day}` }));
    const p = personaModel(b, 0, 'd19');
    expect(p.traits.map((t) => t.name)).toEqual(['Greedy', 'Joker']);
    expect(p.quirk).toBe('Ends deals with “capisce?”');
    expect(p.home).toBe('Celadon City');
    expect(p.effects.map((e) => `${e.trait} · ${e.text}`)).toContain('Greedy · pay raises Loyalty ×2');
    expect(p.effects.find((e) => e.text.includes('bribe'))!.needs).toBe('D22');
    expect(p.memory.map((x) => x.day)).toEqual([2, 3, 4]);
    expect(p.others).toEqual([{ name: 'Gus', look: b.members[1]!.look, traits: traitWords(rollCard('d19', 'Gus')) }]);
    expect(p.offline.endsWith('Capisce?')).toBe(true);
    expect(p.rotom).toBeNull();
    const html = personaView(p, () => null);
    expect(html).toContain('What his traits do');
    expect(html).toContain('PERSONNEL · 001');
  });
});
