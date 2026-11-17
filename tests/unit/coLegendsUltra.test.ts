// Catalog Overhaul Pack (legends): Ultra Beast questlines U1 to U9 (co-legends-9.json).
import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { chooseEvent } from '../../src/core/events';
import { syncLegendFlags } from '../../src/core/legends/signs';
import { chainRooms, PSEUDO_CHAINS } from '../../src/core/dungeon/pseudo';
import { chooseStarter, createRun } from '../../src/core/run';
import { freshUltra } from '../../src/core/ultra/run';
import { ULTRA_RULE_IDS } from '../../src/core/ultra/beasts';
import type { RunState } from '../../src/core/state';
import nine from '../../src/data/events/co-legends-9.json';
import status from '../../src/data/catalogOverhaul/status/legends.json';
import placement from '../../src/data/catalogOverhaul/placement/legends.json';
import { content } from './helpers';

function at(eventId: string, seed: string, setup?: (run: RunState) => void): RunState {
  const run = structuredClone(chooseStarter(content, createRun(content, { runId: 'ub', seed, archetypeId: 'red' }), 0));
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

describe('Ultra Beast questlines U1 to U9', () => {
  it('each has an entry, a status line and a placement; species, rooms, cast art and Ultra Rules all exist', () => {
    const extra = (status as { extra: Record<string, string> }).extra;
    for (let n = 1; n <= 9; n++) {
      const id = extra[`U${n}`]!;
      expect(content.events.get(id), `U${n}`).toBeDefined();
      expect((placement as Record<string, unknown>)[id], `U${n}`).toBeDefined();
    }
    const text = JSON.stringify(nine);
    for (const m of text.matchAll(/"pokemon":"([^"]+)"/g)) expect(content.species.has(m[1]!), m[1]).toBe(true);
    for (const m of text.matchAll(/"(?:species|team)":\[([^\]]*)\]/g)) for (const s of JSON.parse(`[${m[1]}]`) as string[]) expect(content.species.has(s), s).toBe(true);
    for (const m of text.matchAll(/"kind":"addEvent","eventId":"([^"]+)"/g)) expect(content.events.get(m[1]!), m[1]).toBeDefined();
    for (const m of text.matchAll(/"ultra":"([^"]+)"/g)) expect(ULTRA_RULE_IDS as readonly string[]).toContain(m[1]);
    for (const m of text.matchAll(/"(boss|trainer)\.([^"]+)"/g)) expect(existsSync(`public/assets/images/${m[1] === 'boss' ? 'bosses' : 'trainer'}/${m[2]}.png`), m[0]).toBe(true);
  });

  it('every questline entry needs the Ultra setting on this run (the `ultra-on` mirror flag)', () => {
    for (const e of nine.events as { id: string; room?: boolean; requires?: unknown[] }[]) {
      if (e.room) continue;
      expect(e.requires, e.id).toContainEqual({ kind: 'flag', key: 'ultra-on', atLeast: 1, atMost: 99 });
    }
    const run = at('co-u1-noodles', 'on');
    run.expansion = { ...run.expansion, ultra: undefined };
    delete run.story.flags['ev:ultra-on'];
    syncLegendFlags(run);
    expect(f(run, 'ultra-on')).toBe(0);
    run.expansion = { ...run.expansion, ultra: { ...freshUltra(), contact: 'static', beastId: 'ub-glutton' } };
    syncLegendFlags(run);
    expect([f(run, 'ultra-on'), f(run, 'ultra-static'), f(run, 'ultra-beast-guzzlord')]).toEqual([1, 1, 1]);
  });

  it('every Beast fight is a pseudo fight, so losing never ends the run', () => {
    const wilds: { pseudo?: boolean }[] = [];
    const walk = (o: unknown): void => {
      if (!o || typeof o !== 'object') return;
      const b = (o as { battle?: { kind?: string } }).battle;
      if (b?.kind === 'wild') wilds.push(b as never);
      if (b?.kind === 'trainer') expect((b as { friendly?: boolean }).friendly, JSON.stringify(b).slice(0, 60)).toBe(true);
      for (const v of Object.values(o)) walk(v);
    };
    walk(nine);
    expect(wilds.length).toBeGreaterThan(5);
    for (const w of wilds) expect(w.pseudo).toBe(true);
  });

  it('U1: the Task Force gives a Beast Ball either way and starts the missions', () => {
    const run = pick(at('co-u1-noodles', 'tf'), 'co-u1-noodles', 0);
    expect(f(run, 'task-force')).toBe(1);
    expect(run.inventory['beast-ball'] ?? 0).toBeGreaterThan(0);
    const refused = pick(at('co-u1-noodles', 'tf2'), 'co-u1-noodles', 2);
    expect(f(refused, 'ub-refused-help')).toBe(1);
    expect(refused.inventory['beast-ball'] ?? 0).toBeGreaterThan(0);
    expect(content.events.get('co-u1-mission-2')!.requires).toContainEqual(expect.objectContaining({ key: 'u1-missions', atLeast: 1, atMost: 1 }));
  });

  it('U4 and U5 are Doors (home worlds): pseudo chains whose rooms walk out, and entering raises the Faller rank', () => {
    for (const entry of ['co-u4-midway', 'co-u5-city']) {
      const chain = PSEUDO_CHAINS.find((c) => c.entry === entry)!;
      expect(chain, entry).toBeDefined();
      const r = chainRooms(content, chain);
      expect(r.length, entry).toBeGreaterThan(entry === 'co-u4-midway' ? 4 : 0);
      expect(r.some((x) => x.next.length === 0), entry).toBe(true);
    }
    const run = pick(at('co-u5-city', 'rc'), 'co-u5-city', 0);
    expect(f(run, 'faller-rank')).toBe(1);
    expect(rooms(run)).toContain('co-u5-stadium');
  });

  it('U4: three good acts bring Blacephalon out; repeating yourself sends it back to its booth', () => {
    let run = at('co-u4-act-1', 'mw');
    run = pick(run, 'co-u4-act-1', 0);
    run = pick(run, 'co-u4-act-2', 0);
    run = pick(run, 'co-u4-act-3', 0);
    expect(f(run, 'midway-cheer')).toBe(3);
    expect(f(pick(run, 'co-u4-curtain', 0), 'midway-triumph')).toBe(1);
    let dull = at('co-u4-act-1', 'mw2');
    dull = pick(dull, 'co-u4-act-1', 1);
    dull = pick(dull, 'co-u4-act-2', 1);
    dull = pick(dull, 'co-u4-act-3', 1);
    const after = pick(dull, 'co-u4-curtain', 0);
    expect([f(after, 'midway-done'), f(after, 'midway-triumph')]).toEqual([1, 0]);
    expect(rooms(after)).not.toContain('co-u4-booth');
  });

  it('U9 needs the Task Force and Faller rank 2; Guide them home is a calm, not a knockout', () => {
    const sky = content.events.get('co-u9-sky')!;
    expect(sky.requires).toContainEqual(expect.objectContaining({ key: 'faller-rank', atLeast: 2 }));
    expect(sky.choices[1]!.success.battle).toMatchObject({ pseudo: true, rule: { calmBar: { need: 4 } } });
  });
});
