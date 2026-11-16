// Catalog Overhaul Pack (legends): Mythical Visits MY1 to MY22 and Z5 (co-legends-7.json, co-legends-8.json).
import { describe, expect, it } from 'vitest';
import { activeVariant } from '../../src/core/eventMemory';
import { chooseEvent } from '../../src/core/events';
import { legendFlag } from '../../src/core/legends/signs';
import { chooseStarter, createRun } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import seven from '../../src/data/events/co-legends-7.json';
import eight from '../../src/data/events/co-legends-8.json';
import status from '../../src/data/catalogOverhaul/status/legends.json';
import placement from '../../src/data/catalogOverhaul/placement/legends.json';
import { content } from './helpers';

function at(eventId: string, seed: string, setup?: (run: RunState) => void): RunState {
  const run = structuredClone(chooseStarter(content, createRun(content, { runId: 'my', seed, archetypeId: 'red' }), 0));
  run.expansion = { ...run.expansion, promises: true };
  const node = run.stage!.map.nodes[0]!;
  run.stage!.current = node.id;
  run.stage!.visited = [node.id];
  node.sides.push({ id: 'x', kind: 'event', used: false, eventId } as never);
  setup?.(run);
  return run;
}
const f = (run: RunState, key: string) => run.story.flags[`ev:${key}`] ?? 0;
const rooms = (run: RunState) => run.stage!.map.nodes[0]!.sides.filter((s) => s.kind === 'event' && !s.used).map((s) => (s as { eventId?: string }).eventId);
const pick = (run: RunState, eventId: string, choice: number): RunState => {
  const side = run.stage!.map.nodes[0]!.sides.find((s) => s.kind === 'event' && !s.used && (s as { eventId?: string }).eventId === eventId)!;
  return chooseEvent(content, run, side.id, choice).run;
};

describe('Mythical Visits MY1 to MY22 and Z5', () => {
  it('each has an entry, a status line and a placement, and every species, room and Promise room exists', () => {
    const extra = (status as { extra: Record<string, string> }).extra;
    for (const code of [...Array.from({ length: 22 }, (_, i) => `MY${i + 1}`).filter((c) => c !== 'MY11'), 'Z5']) {
      const id = extra[code]!;
      expect(content.events.get(id), code).toBeDefined();
      expect((placement as Record<string, unknown>)[id], code).toBeDefined();
    }
    const text = JSON.stringify([seven, eight]);
    for (const m of text.matchAll(/"pokemon":"([^"]+)"/g)) expect(content.species.has(m[1]!), m[1]).toBe(true);
    for (const m of text.matchAll(/"species":\[([^\]]*)\]/g)) for (const s of JSON.parse(`[${m[1]}]`) as string[]) expect(content.species.has(s), s).toBe(true);
    for (const m of text.matchAll(/"kind":"addEvent","eventId":"([^"]+)"/g)) expect(content.events.get(m[1]!), m[1]).toBeDefined();
    expect(content.species.has('darkrai-z-mega')).toBe(true);
  });

  it('every Mythical fight is a pseudo fight with no items (nothing can be caught), and a Visit never forces one', () => {
    const wilds: { pseudo?: boolean; rule?: { noItems?: boolean } }[] = [];
    const walk = (o: unknown): void => {
      if (!o || typeof o !== 'object') return;
      const b = (o as { battle?: { kind?: string } }).battle;
      if (b?.kind === 'wild') wilds.push(b as never);
      for (const v of Object.values(o)) walk(v);
    };
    walk([seven, eight]);
    expect(wilds.length).toBeGreaterThan(5);
    for (const w of wilds) expect(w.pseudo && w.rule?.noItems, JSON.stringify(w).slice(0, 80)).toBe(true);
    for (const e of [...seven.events, ...eight.events] as unknown as { id: string; choices: { battle?: unknown; success: { battle?: unknown } }[] }[]) {
      if (e.choices.length > 0) expect(e.choices.some((c) => !c.success.battle), e.id).toBe(true);
    }
  });

  it('a Visit opens only once believed (three Tellings) and only while no Mythical has visited', () => {
    const run = at('co-my1-clearing', 'b1');
    const req = content.events.get('co-my1-clearing')!.requires;
    expect(req).toContainEqual(expect.objectContaining({ key: 'believed-mew', atLeast: 1 }));
    expect(req).toContainEqual(expect.objectContaining({ key: 'mythical-visited', atMost: 0 }));
    legendFlag(run, 'telling-mew', 2);
    expect(f(run, 'believed-mew')).toBe(0);
    legendFlag(run, 'telling-mew', 1);
    expect(f(run, 'believed-mew')).toBe(1);
  });

  it('the Promise room makes the Mythical the Guest; asking first comes back to it; a second Mythical cannot come', () => {
    let run = at('co-my1-clearing', 'p1');
    run = pick(run, 'co-my1-clearing', 2);
    expect(rooms(run)).toContain('co-my-mew-promise');
    run = pick(run, 'co-my-mew-promise', 2);
    expect(rooms(run)).toContain('co-my-mew-promise');
    run = pick(run, 'co-my-mew-promise', 0);
    expect(run.expansion?.promise?.guest).toEqual({ id: 'mew', forgiven: false });
    expect(f(run, 'guest-mew')).toBe(1);
    expect(f(run, 'mythical-visited')).toBe(1);
    legendFlag(run, 'vow-celebi', 1);
    expect(run.expansion?.promise?.guest?.id).toBe('mew');
  });

  it('declining leaves a gift; a disabled Mythical (Melmetal) never becomes the Guest', () => {
    const run = at('co-my-zarude-promise', 'd1');
    const money = run.money;
    const after = pick(run, 'co-my-zarude-promise', 1);
    expect(after.money).toBe(money + 500);
    expect(after.expansion?.promise?.guest ?? null).toBeNull();
    const m = at('co-my21-stack', 'd2');
    expect(legendFlag(m, 'vow-melmetal', 1)).toEqual([]);
    expect(m.expansion?.promise?.guest ?? null).toBeNull();
  });

  it('MY8: three right notes bring Meloetta and the Promise; none sends her away', () => {
    let run = at('co-my8-stall', 'm1');
    run = pick(run, 'co-my8-stall', 0);
    run = pick(run, 'co-my8-note-2', 1);
    run.party[0]!.moves = ['hyper-voice'] as never;
    const ok = content.events.get('co-my8-note-3')!.choices[2]!;
    expect(ok.requires).toEqual([{ kind: 'partyMoveFlag', flag: 'sound' }]);
    run.story.flags['ev:meloetta-notes'] = 3;
    run.stage!.map.nodes[0]!.sides.push({ id: 'song', kind: 'event', used: false, eventId: 'co-my8-song' } as never);
    expect(rooms(pick(run, 'co-my8-song', 0))).toContain('co-my-meloetta-promise');
    const none = at('co-my8-song', 'm0');
    const missed = pick(none, 'co-my8-song', 0);
    expect(f(missed, 'meloetta-missed')).toBe(1);
    expect(rooms(missed)).not.toContain('co-my-meloetta-promise');
  });

  it('Z5: needs Darkrai as Guest and two Promise steps; with Cresselia\'s blessing "Do it." is gone', () => {
    const z = content.events.get('co-z5-dream')!;
    expect(z.requires).toContainEqual(expect.objectContaining({ key: 'guest-darkrai' }));
    expect(z.requires).toContainEqual(expect.objectContaining({ key: 'promise-step-darkrai', atLeast: 2 }));
    expect(z.choices[1]!.success.battle).toMatchObject({ kind: 'trainer', ally: 'darkrai-z-mega', friendly: true });
    const run = at('co-z5-dream', 'z5', (r) => { r.story.flags['ev:blessing-cresselia'] = 1; });
    expect(activeVariant(content, run, z)?.id).toBe('cresselia');
  });
});
