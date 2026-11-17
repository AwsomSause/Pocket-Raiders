// Catalog Overhaul: how a placed event attaches to its node (STAGE_MAP_AND_PLACEMENT.md section 8): before or instead of the battle.
import { describe, expect, it } from 'vitest';
import { attachBlocker, nodeHeld, waitingStop } from '../../src/core/co/attach';
import { readPlacement } from '../../src/core/co/placement';
import { EventDefSchema } from '../../src/core/contentSchema';
import { chooseEvent } from '../../src/core/events';
import { chooseNode, chooseStarter, createRun, mapChoices } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { content } from './helpers';

const ev = (id: string, effects: unknown[] = [], battle?: unknown) =>
  EventDefSchema.parse({ id, name: id, group: 'Test', intro: 'Someone waves you down.', choices: [{ label: 'Listen.', success: { text: 'You listen.', effects, ...(battle ? { battle } : {}) } }] });

function setup(id: string, attaches: string, effects: unknown[] = [], battle?: unknown): { run: RunState; nodeId: string } {
  content.events.set(id, ev(id, effects, battle));
  content.coPlacement = new Map([[id, readPlacement({ attaches })]]);
  const run = chooseStarter(content, createRun(content, { runId: 'r', seed: 'co-attach', archetypeId: 'red' }), 0);
  const node = mapChoices(content, run).find((n) => n.kind === 'wild' || n.kind === 'trainer')!;
  node.sides.push({ id: 'att', kind: 'event', used: false, eventId: id });
  return { run, nodeId: node.id };
}
const done = (id: string) => { content.events.delete(id); content.coPlacement = new Map(); };

describe('events placed before or instead of the battle', () => {
  it('before: the event plays first, the player cannot walk on, then the node battle starts', () => {
    const { run, nodeId } = setup('co-att-before', 'Before the battle');
    const at = chooseNode(content, run, nodeId);
    expect(at.phase).toBe('map');
    expect(at.battle).toBeNull();
    expect(waitingStop(content, at)).toBe('att');
    expect(attachBlocker(content, at)).toContain('co-att-before');
    expect(() => chooseNode(content, at, at.stage!.map.nodes.find((n) => n.column === 2)!.id)).toThrow(/Finish/);
    const after = chooseEvent(content, at, 'att', 0).run;
    expect(after.phase).toBe('battle');
    expect(after.battle).not.toBeNull();
    expect(nodeHeld(after)).toBe(0);
    done('co-att-before');
  });

  it('before: the event can call the fight off', () => {
    const { run, nodeId } = setup('co-att-skip', 'before', [{ kind: 'nodeBattle', skip: true }]);
    const after = chooseEvent(content, chooseNode(content, run, nodeId), 'att', 0).run;
    expect(after.phase).toBe('map');
    expect(after.battle).toBeNull();
    expect(waitingStop(content, after)).toBeNull();
    done('co-att-skip');
  });

  it('before: the event can make the fight harder (stages of level)', () => {
    const plain = setup('co-att-lvl0', 'before');
    const base = chooseEvent(content, chooseNode(content, plain.run, plain.nodeId), 'att', 0).run;
    done('co-att-lvl0');
    const hard = setup('co-att-lvl2', 'before', [{ kind: 'nodeBattle', level: 2 }]);
    const harder = chooseEvent(content, chooseNode(content, hard.run, hard.nodeId), 'att', 0).run;
    done('co-att-lvl2');
    const lv = (r: RunState) => Math.max(...r.battle!.enemyTeam.map((m) => m.level));
    expect(lv(harder)).toBeGreaterThan(lv(base));
  });

  it("before: an event that starts its own battle takes the node battle's place", () => {
    const { run, nodeId } = setup('co-att-own', 'before', [], { kind: 'wild', species: ['rattata'] });
    const after = chooseEvent(content, chooseNode(content, run, nodeId), 'att', 0).run;
    expect(after.phase).toBe('battle');
    expect(after.battle!.event?.eventId).toBe('co-att-own');
    expect(nodeHeld(after)).toBe(0);
    done('co-att-own');
  });

  it('instead: the event is the node; no battle is fought', () => {
    const { run, nodeId } = setup('co-att-instead', 'Instead of the battle');
    const at = chooseNode(content, run, nodeId);
    expect(at.battle).toBeNull();
    const after = chooseEvent(content, at, 'att', 0).run;
    expect(after.phase).toBe('map');
    expect(after.battle).toBeNull();
    expect(mapChoices(content, after).length).toBeGreaterThan(0);
    done('co-att-instead');
  });

  it('after (the default) changes nothing: the battle comes first', () => {
    const { run, nodeId } = setup('co-att-after', 'After the battle');
    const at = chooseNode(content, run, nodeId);
    expect(at.phase).toBe('battle');
    expect(waitingStop(content, at)).toBeNull();
    done('co-att-after');
  });
});
