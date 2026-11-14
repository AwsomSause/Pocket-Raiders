// Node Event Menus P5: special entries (fork, linked, Rival Takes It, escort).

import { describe, expect, it } from 'vitest';
import { chooseStarter, createRun } from '../../src/core/run';
import { RunStateSchema, type MapNode, type RunState } from '../../src/core/state';
import { SPECIAL } from '../../src/core/nodeMenu/special/data';
import { arriveAtNode, onSkipped, pickSpecial, rivalSpoilLevels, specialEntriesFor, specialState, spendRivalSpoils } from '../../src/core/nodeMenu/special';
import { isGiftable } from '../../src/core/events';
import { content } from './helpers';

const freshRun = (seed = 'nm-special') => chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red' }), 0);
const nodeAt = (run: RunState, column: number): MapNode => run.stage!.map.nodes.find((n) => n.column === column)!;
const ctx = (run: RunState, column: number) => ({ content, run, node: nodeAt(run, column) });
const addRival = (run: RunState, id = 'r1', name = 'Gary') => run.story.rivals.push({ id, name, state: 'active' } as never);

describe('special entries data', () => {
  it('every item given exists and can be given', () => {
    const effects = [...SPECIAL.forks.flatMap((f) => [...f.a.now, ...f.a.later, ...f.b.now, ...f.b.later]), ...SPECIAL.links.flatMap((l) => [...l.start.effects, ...l.end.effects]), ...SPECIAL.escorts.flatMap((e) => e.reward)];
    for (const e of effects) if (e.kind === 'item') expect(isGiftable(content, e.id), e.id).toBe(true);
  });
});

describe('fork', () => {
  it('pays the chosen half once; the other half is closed', () => {
    const run = freshRun();
    run.money = 1000;
    const f = SPECIAL.forks.find((x) => x.id === 'fork-river')!;
    const lines = pickSpecial(ctx(run, 1), `sp:fork:${f.id}:a`);
    expect(lines[0]).toContain(f.a.text);
    expect(run.money).toBe(800);
    expect(pickSpecial(ctx(run, 1), `sp:fork:${f.id}:b`)).toEqual([]);
    expect(pickSpecial(ctx(run, 1), `sp:fork:${f.id}:a`)).toEqual([]);
    expect(run.money).toBe(800);
  });
  it('the "later" half pays at the next node, once, even if arrive is called twice', () => {
    const run = freshRun();
    run.money = 0;
    pickSpecial(ctx(run, 1), 'sp:fork:fork-camp:b');
    expect(run.money).toBe(0);
    expect(arriveAtNode(ctx(run, 2)).join(' ')).toContain('pays off');
    expect(run.money).toBe(700);
    expect(arriveAtNode(ctx(run, 2))).toEqual([]);
    expect(run.money).toBe(700);
  });
  it('rejects unknown ids', () => {
    const run = freshRun();
    expect(pickSpecial(ctx(run, 1), 'sp:fork:nope:a')).toEqual([]);
    expect(pickSpecial(ctx(run, 1), 'sp:fork:fork-camp:c')).toEqual([]);
    expect(pickSpecial(ctx(run, 1), 'sp:what')).toEqual([]);
  });
});

describe('linked', () => {
  it('the start plants a follow-up card in the next columns; finishing pays once', () => {
    const run = freshRun();
    run.money = 0;
    pickSpecial(ctx(run, 1), 'sp:link:link-parcel:start');
    expect(specialEntriesFor(ctx(run, 1)).some((e) => e.id === 'sp:link:link-parcel:end')).toBe(false);
    expect(specialEntriesFor(ctx(run, 2)).some((e) => e.id === 'sp:link:link-parcel:end')).toBe(true);
    pickSpecial(ctx(run, 2), 'sp:link:link-parcel:end');
    expect(run.money).toBe(900);
    expect(pickSpecial(ctx(run, 2), 'sp:link:link-parcel:end')).toEqual([]);
    expect(run.money).toBe(900);
    expect(specialEntriesFor(ctx(run, 3)).some((e) => e.id === 'sp:link:link-parcel:end')).toBe(false);
  });
  it('a follow-up not taken in time expires', () => {
    const run = freshRun();
    pickSpecial(ctx(run, 1), 'sp:link:link-parcel:start');
    const until = specialState(run).links[0]!.until;
    const lines = arriveAtNode(ctx(run, Math.min(until + 1, run.stage!.map.columns)));
    if (until + 1 <= run.stage!.map.columns) expect(lines.join(' ')).toContain('chance has passed');
    if (until + 1 <= run.stage!.map.columns) expect(specialState(run).links).toEqual([]);
  });
});

describe('escort', () => {
  it('finishes after its nodes with nerve left and pays once', () => {
    const run = freshRun();
    run.money = 0;
    const e = SPECIAL.escorts.find((x) => x.id === 'escort-merchant')!;
    pickSpecial(ctx(run, 1), `sp:escort:${e.id}`);
    expect(pickSpecial(ctx(run, 1), 'sp:escort:escort-kid')).toEqual([]);
    arriveAtNode(ctx(run, 2));
    expect(specialState(run).escort?.nodesLeft).toBe(1);
    expect(arriveAtNode(ctx(run, 3)).join(' ')).toContain(e.done);
    expect(run.money).toBe(1500);
    expect(specialState(run).escort).toBeNull();
  });
  it('arriving with fainted Pokémon breaks their nerve', () => {
    const run = freshRun();
    pickSpecial(ctx(run, 1), 'sp:escort:escort-kid');
    specialState(run).escort!.nerve = 1;
    for (const m of run.party) m.hp = 0;
    expect(arriveAtNode(ctx(run, 2))).toContain(SPECIAL.escorts.find((x) => x.id === 'escort-kid')!.fail);
    expect(specialState(run).escort).toBeNull();
  });
});

describe('Rival Takes It', () => {
  const skipped = [{ id: 'side:s1', kind: 'side', label: 'Lost Wallet', required: false }];
  it('needs a rival; takes nothing required or micro', () => {
    const run = freshRun();
    expect(onSkipped(ctx(run, 1), skipped)).toEqual([]);
    addRival(run);
    expect(onSkipped(ctx(run, 1), [{ id: 'm', kind: 'micro', label: 'x', required: false }, { id: 'r', kind: 'side', label: 'y', required: true }])).toEqual([]);
  });
  it('over many nodes, a rival takes some cards, capped per stage; levels capped and spent after the fight', () => {
    const run = freshRun();
    addRival(run);
    const lines = run.stage!.map.nodes.flatMap((n) => onSkipped({ content, run, node: n }, skipped));
    expect(lines.length).toBeGreaterThan(0);
    expect(lines.length).toBeLessThanOrEqual(SPECIAL.rules.rivalTakes.maxPerStage);
    expect(lines[0]).toContain('Gary');
    expect(rivalSpoilLevels(run, 'r1')).toBeGreaterThan(0);
    expect(rivalSpoilLevels(run, 'r1')).toBeLessThanOrEqual(SPECIAL.rules.rivalTakes.maxLevels);
    expect(rivalSpoilLevels(run, 'other')).toBe(0);
    spendRivalSpoils(run, 'r1');
    expect(rivalSpoilLevels(run, 'r1')).toBe(0);
  });
});

describe('rolls and saves', () => {
  it('same seed and node give the same cards; menus never offer more than the cap of new specials', () => {
    let seen = 0;
    for (let i = 0; i < 30; i++) {
      const run = freshRun(`nm-${i}`);
      for (const n of run.stage!.map.nodes) {
        const a = specialEntriesFor({ content, run, node: n });
        expect(specialEntriesFor({ content, run, node: n })).toEqual(a);
        const fresh = a.filter((e) => !e.id.endsWith(':end'));
        const forks = fresh.filter((e) => e.category === 'fork').length;
        expect(fresh.length - (forks ? forks - 1 : 0)).toBeLessThanOrEqual(SPECIAL.rules.maxSpecialPerMenu);
        seen += fresh.length;
      }
    }
    expect(seen).toBeGreaterThan(0);
  });
  it('the state survives a save round trip and reloading does not pay twice', () => {
    const run = freshRun();
    run.money = 0;
    pickSpecial(ctx(run, 1), 'sp:fork:fork-camp:b');
    pickSpecial(ctx(run, 1), 'sp:link:link-parcel:start');
    const loaded = RunStateSchema.parse(JSON.parse(JSON.stringify(run)));
    expect(loaded.expansion?.nodeMenuSpecial).toEqual(run.expansion?.nodeMenuSpecial);
    arriveAtNode(ctx(loaded, 2));
    arriveAtNode(ctx(loaded, 2));
    expect(loaded.money).toBe(700);
  });
  it('a run that never used special entries has no block', () => {
    const run = freshRun();
    arriveAtNode(ctx(run, 2));
    expect(run.expansion?.nodeMenuSpecial).toBeUndefined();
  });
});
