import { describe, expect, it } from 'vitest';
import { eligibleEvents } from '../../src/core/events';
import { PSEUDO, pseudoEvents, pseudoGateId, validateAllPseudo, validatePseudo } from '../../src/core/dungeon/pseudo';
import { chooseStarter, createRun, pseudoLost } from '../../src/core/run';
import { maxHp } from '../../src/core/pokemon';
import { content } from './helpers';

const newRun = (seed: string) => structuredClone(chooseStarter(content, createRun(content, { runId: 'ps', seed, archetypeId: 'red' }), 0));

describe('W7 pseudo stage records', () => {
  it('has the 10 records, each valid (3 to 6 rooms, every branch reaches the exit), and only the hideout counts as a stage', () => {
    expect(PSEUDO.records).toHaveLength(10);
    expect(validateAllPseudo()).toEqual([]);
    expect(PSEUDO.records.filter((r) => r.countsAsStage).map((r) => r.id)).toEqual(['ps_evil_hideout']);
    expect(PSEUDO.records.every((r) => r.status === 'limited')).toBe(true);
  });
  it('rejects a record that breaks the rules', () => {
    const base = structuredClone(PSEUDO.records[0]!);
    expect(validatePseudo({ ...base, countsAsStage: true }).join()).toMatch(/only the evil hideout/);
    expect(validatePseudo({ ...base, reward: { item: 'ultra-ball', count: 9 } }).join()).toMatch(/reward over/);
    expect(validatePseudo({ ...base, nodes: [{ id: 'a', kind: 'wild', next: ['b'] }, { id: 'b', kind: 'exit', next: [] }] as never }).length).toBeGreaterThan(0);
  });
});

describe('W7 gates and rooms', () => {
  it('every gate offers Leave and Enter before any fight (P2) and every room is in the live content', () => {
    for (const r of PSEUDO.records) {
      const gate = content.events.get(pseudoGateId(r))!;
      expect(gate.room).toBe(true);
      expect(gate.choices.map((c) => c.label)).toEqual([`Enter ${r.name}`, 'Leave']);
      expect(gate.choices.every((c) => !c.success.battle)).toBe(true);
    }
    expect(pseudoEvents().length).toBe(PSEUDO.records.length + PSEUDO.records.reduce((n, r) => n + r.nodes.length, 0));
  });
  it('every battle inside a pseudo stage is marked so a loss ejects (P5)', () => {
    for (const e of pseudoEvents() as { id: string; choices: { success: { battle?: { pseudo?: boolean } }; failure?: { battle?: { pseudo?: boolean } } }[] }[]) {
      for (const c of e.choices) for (const o of [c.success, c.failure]) if (o?.battle) expect(o.battle.pseudo, e.id).toBe(true);
    }
  });
  it('the boss reward is not doubled: the boss win adds no extra reward item (P4)', () => {
    const rooms = pseudoEvents() as { id: string; choices: { success: { effects: { kind: string; id?: string }[]; battle?: { win: { kind: string }[] } } }[] }[];
    for (const r of PSEUDO.records) {
      const boss = r.nodes.filter((n) => n.kind === 'boss').map((n) => r.id.replace(/_/g, '-') + '-' + n.id);
      const items = rooms.filter((e) => boss.includes(e.id)).flatMap((e) => e.choices.flatMap((c) => [...c.success.effects, ...(c.success.battle?.win ?? [])])).filter((x) => x.kind === 'item' && (x as { id?: string }).id === r.reward.item);
      expect(items.length, r.id).toBe(0);
    }
  });
  it('a loss ejects with a partial heal and the run goes on, without touching stage, badges or regions (P1, P5)', () => {
    const run = newRun('p5');
    run.party.forEach((m) => { m.hp = 0; m.status = { id: 'psn' } as never; });
    const before = { stage: run.stage?.index, badges: run.badges.length, cleared: run.regionsCleared.length, region: run.regionIndex };
    pseudoLost(content, run);
    expect(run.party.every((m) => m.hp === Math.max(1, Math.floor(maxHp(content, m) * PSEUDO.rules.failureHeal)) && m.status === null)).toBe(true);
    expect(run.phase).toBe('map');
    expect({ stage: run.stage?.index, badges: run.badges.length, cleared: run.regionsCleared.length, region: run.regionIndex }).toEqual(before);
  });
});

describe('W7 caps (P3)', () => {
  const entry = 'ev-trainer-tournament';
  const offered = (run: ReturnType<typeof newRun>) => eligibleEvents(content, run).some((e) => e.id === entry);
  it('1 per region, 2 per run, and never in a League stage or a blocked campaign', () => {
    const run = newRun('p3');
    run.regionIndex = 0;
    run.stage = { ...(run.stage as object), index: 3 } as never;
    expect(content.events.get(entry)!.pseudo).toBe(true);
    const fresh = structuredClone(run);
    run.itemCounters = { 'pseudo-seen:0': 1 };
    expect(eligibleEvents(content, run).some((e) => e.pseudo)).toBe(false);
    run.regionIndex = 1;
    expect(eligibleEvents(content, run).some((e) => e.id === 'ev-champions-invitation')).toBe(false); // needs reputation, not a cap
    run.itemCounters = { 'pseudo-seen:0': 1, 'pseudo-seen:1': 1 };
    run.regionIndex = 2;
    expect(eligibleEvents(content, run).some((e) => e.pseudo)).toBe(false);
    const blocked = structuredClone(fresh);
    blocked.campaignId = 'boss-rush';
    expect(offered(blocked)).toBe(false);
  });
});
