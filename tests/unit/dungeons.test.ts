import { describe, expect, it } from 'vitest';
import { BASIC_ENTRANCES, dungeonEvents, entranceEventId, THEMED_ENTRANCES } from '../../src/core/dungeon/compile';
import { DUNGEONS, validateAllDungeons, validateDungeon, type DungeonDef } from '../../src/core/dungeon/schema';
import { content } from './helpers';

const bad = (patch: Partial<DungeonDef>): DungeonDef => ({ ...structuredClone(DUNGEONS.dungeons[0]!), ...patch });

describe('W6 dungeon definitions', () => {
  it('has 8 basic (3 to 5 nodes) and 8 themed (6 to 9 nodes) dungeons that all validate', () => {
    expect(validateAllDungeons()).toEqual([]);
    expect(DUNGEONS.dungeons.filter((d) => d.kind === 'basic')).toHaveLength(8);
    expect(DUNGEONS.dungeons.filter((d) => d.kind === 'themed')).toHaveLength(8);
  });
  it('rejects bad graphs: dead end, loop, 3 wild in a row, too few kinds, size, hidden-only, missing boss', () => {
    const base = DUNGEONS.dungeons[0]!;
    expect(validateDungeon(bad({ nodes: [{ id: 'a', kind: 'wild', next: ['b'] }, { id: 'b', kind: 'cache', next: [] }, { id: 'e', kind: 'exit', next: [] }] }))).toEqual(expect.arrayContaining([expect.stringMatching(/does not lead to the exit|unreachable/)]));
    expect(validateDungeon(bad({ nodes: [{ id: 'a', kind: 'wild', next: ['b'] }, { id: 'b', kind: 'cache', next: ['a', 'e'] }, { id: 'e', kind: 'exit', next: [] }] })).join()).toMatch(/loop/);
    expect(validateDungeon(bad({ nodes: [{ id: 'a', kind: 'wild', next: ['b'] }, { id: 'b', kind: 'wild', next: ['c'] }, { id: 'c', kind: 'wild', next: ['d'] }, { id: 'd', kind: 'exit', next: [] }] })).join()).toMatch(/3 wild rooms in a row/);
    expect(validateDungeon(bad({ nodes: [{ id: 'a', kind: 'wild', next: ['b'] }, { id: 'b', kind: 'wild', next: ['e'] }, { id: 'e', kind: 'exit', next: [] }] })).join()).toMatch(/3 different node kinds/);
    expect(validateDungeon(bad({ nodes: base.nodes.slice(0, 2).map((n) => ({ ...n, next: [] })) as never })).length).toBeGreaterThan(0);
    expect(validateDungeon(bad({ nodes: [{ id: 'a', kind: 'wild', next: ['h'] }, { id: 'h', kind: 'hidden', next: ['c'] }, { id: 'c', kind: 'cache', next: ['e'] }, { id: 'e', kind: 'exit', next: [] }] })).join()).toMatch(/only leads to a hidden room/);
    expect(validateDungeon(bad({ kind: 'themed', boss: undefined }))).toEqual(expect.arrayContaining([expect.stringMatching(/boss/)]));
  });
});

describe('W6 compiled rooms', () => {
  it('every room becomes a room event in the live content, and every branch can be walked from the entrance to the exit', () => {
    const rooms = dungeonEvents();
    expect(rooms.length).toBe(DUNGEONS.dungeons.reduce((n, d) => n + d.nodes.length, 0));
    for (const d of DUNGEONS.dungeons) {
      let reached = 0;
      const seen = new Set<string>();
      const walk = (id: string) => {
        if (seen.has(id)) return;
        seen.add(id);
        const e = content.events.get(id);
        expect(e, id).toBeDefined();
        expect(e!.room).toBe(true);
        const nexts = e!.choices.flatMap((c) => [c.success, c.failure].flatMap((o) => (o ? [...o.effects, ...(o.battle?.win ?? [])] : []))).flatMap((x) => (x.kind === 'addEvent' ? [x.eventId] : []));
        if (nexts.length === 0) reached += id.endsWith(`-${d.nodes.find((n) => n.kind === 'exit')!.id}`) ? 1 : 0;
        for (const n of nexts) walk(n);
      };
      walk(entranceEventId(d));
      expect(seen.size, d.id).toBe(d.nodes.length);
      expect(reached, d.id).toBe(1);
    }
  });
  it('hidden rooms need a Key Charm and traps can be skipped with an Escape Rope', () => {
    const rooms = dungeonEvents() as { id: string; choices: { requires?: { id?: string }[]; label: string }[] }[];
    const skyBridgeTrainer = rooms.find((r) => r.id === 'dg-sky-bridge-b')!;
    expect(skyBridgeTrainer.choices.some((c) => c.requires?.some((q) => q.id === 'key-charm'))).toBe(true);
    const trap = rooms.find((r) => r.id === 'dg-desert-well-b')!;
    expect(trap.choices.some((c) => c.requires?.some((q) => q.id === 'escape-rope'))).toBe(true);
  });
  it('the gate events open real entrances', () => {
    for (const id of [...BASIC_ENTRANCES(), ...THEMED_ENTRANCES()]) expect(content.events.get(id)?.room).toBe(true);
    const gate = content.events.get('ev-abandoned-expedition')!;
    expect(gate.disabled).toBe(false);
    expect(content.events.get('ev-hidden-dungeon')!.secret.length).toBeGreaterThan(0);
  });
});
