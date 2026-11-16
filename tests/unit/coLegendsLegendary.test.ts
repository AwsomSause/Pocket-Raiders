// Catalog Overhaul Pack (legends): Legendary questlines L2 to L15 (co-legends-5.json, co-legends-6.json).
import { describe, expect, it } from 'vitest';
import { activeVariant } from '../../src/core/eventMemory';
import { chooseEvent } from '../../src/core/events';
import { chainRooms, PSEUDO_CHAINS } from '../../src/core/dungeon/pseudo';
import { chooseStarter, createRun } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import five from '../../src/data/events/co-legends-5.json';
import six from '../../src/data/events/co-legends-6.json';
import status from '../../src/data/catalogOverhaul/status/legends.json';
import placement from '../../src/data/catalogOverhaul/placement/legends.json';
import { content } from './helpers';

function at(eventId: string, seed: string, setup?: (run: RunState) => void): RunState {
  const run = structuredClone(chooseStarter(content, createRun(content, { runId: 'lg', seed, archetypeId: 'red' }), 0));
  const node = run.stage!.map.nodes[0]!;
  run.stage!.current = node.id;
  run.stage!.visited = [node.id];
  node.sides.push({ id: 'x', kind: 'event', used: false, eventId } as never);
  setup?.(run);
  return run;
}
const f = (run: RunState, key: string) => run.story.flags[`ev:${key}`] ?? 0;

describe('Legendary questlines L2 to L15', () => {
  it('each has an entry, a status line and a placement, and every species, item and room exists', () => {
    const extra = (status as { extra: Record<string, string> }).extra;
    for (let n = 2; n <= 15; n++) {
      const id = extra[`L${n}`]!;
      expect(content.events.get(id), `L${n}`).toBeDefined();
      expect((placement as Record<string, unknown>)[id], `L${n}`).toBeDefined();
    }
    const text = JSON.stringify([five, six]);
    for (const m of text.matchAll(/"pokemon":"([^"]+)"/g)) expect(content.species.has(m[1]!), m[1]).toBe(true);
    for (const m of text.matchAll(/"species":\[([^\]]*)\]/g)) for (const s of JSON.parse(`[${m[1]}]`) as string[]) expect(content.species.has(s), s).toBe(true);
    for (const m of text.matchAll(/"kind":"(?:item|loseItem)","id":"([^"]+)"/g)) expect(content.items.has(m[1]!) || content.catalog.has(m[1]!), m[1]).toBe(true);
    for (const m of text.matchAll(/"kind":"addEvent","eventId":"([^"]+)"/g)) expect(content.events.get(m[1]!), m[1]).toBeDefined();
  });

  it('every Legendary fight is a pseudo fight: losing never ends the run', () => {
    const wilds: { pseudo?: boolean }[] = [];
    const walk = (o: unknown): void => {
      if (!o || typeof o !== 'object') return;
      const b = (o as { battle?: { kind?: string } }).battle;
      if (b?.kind === 'wild') wilds.push(b as { pseudo?: boolean });
      for (const v of Object.values(o)) walk(v);
    };
    walk([five, six]);
    expect(wilds.length).toBeGreaterThan(20);
    for (const w of wilds) expect(w.pseudo, JSON.stringify(w).slice(0, 80)).toBe(true);
  });

  it('L2: Articuno\'s trial is six turns without a damaging move; two passed bring the third, jealous', () => {
    const a = content.events.get('co-l2-articuno-1')!;
    expect(a.choices[0]!.success.battle).toMatchObject({ rule: { surviveTurns: 6, noAttacks: true }, pseudo: true });
    const jealous = content.events.get('co-l2-jealous-moltres')!;
    expect(jealous.requires).toContainEqual(expect.objectContaining({ key: 'birds-passed', atLeast: 2 }));
  });

  it('L2: the Zapdos climb strikes a lead that is not Ground-type', () => {
    const run = chooseEvent(content, at('co-l2-zapdos-1', 'zz'), 'x', 0).run;
    const ground = run.party.find((m) => m.hp > 0)!;
    const isGround = content.species.get(ground.speciesId)!.types.includes('ground');
    expect(f(run, 'zapdos-strikes')).toBe(isGround ? 0 : 1);
  });

  it('L3: the Bell Tower rings only for three helped places', () => {
    const run = chooseEvent(content, at('co-l3-tower', 'ho', (r) => { r.story.flags['ev:hooh-feather'] = 1; r.story.flags['ev:hooh-helped'] = 3; }), 'x', 0).run;
    expect(run.stage!.map.nodes[0]!.sides.some((s) => (s as { eventId?: string }).eventId === 'co-l3-roof')).toBe(true);
    const none = chooseEvent(content, at('co-l3-tower', 'ho0', (r) => { r.story.flags['ev:hooh-feather'] = 1; }), 'x', 0).run;
    expect(f(none, 'hooh-ended')).toBe(1);
    expect(none.stage!.map.nodes[0]!.sides.some((s) => (s as { eventId?: string }).eventId === 'co-l3-roof')).toBe(false);
  });

  it('L4 and L5 are Doors: pseudo chains whose rooms walk out', () => {
    for (const entry of ['co-l4-whirl', 'co-l5-cave']) {
      const chain = PSEUDO_CHAINS.find((c) => c.entry === entry)!;
      expect(chain, entry).toBeDefined();
      const rooms = chainRooms(content, chain);
      expect(rooms.length, entry).toBeGreaterThan(2);
      expect(rooms.some((r) => r.next.length === 0), entry).toBe(true);
    }
  });

  it('Recognition: with the Legendary\'s blessing at Influence 7, it offers itself', () => {
    const island = content.events.get('co-l4-island-4')!;
    const run = at('co-l4-island-4', 'lu', (r) => { r.story.flags['ev:blessing-lugia'] = 1; r.story.flags['ev:blessing-influence'] = 7; });
    expect(activeVariant(content, run, island)?.id).toBe('recognition');
    const low = at('co-l4-island-4', 'lu2', (r) => { r.story.flags['ev:blessing-lugia'] = 1; r.story.flags['ev:blessing-influence'] = 6; });
    expect(activeVariant(content, low, island)).toBeNull();
  });

  it('L9: Uxie knows a lie; L15 pulling the rest curses the region', () => {
    const lake = content.events.get('co-l9-lake-1')!;
    expect(lake.choices[0]!.branches?.[0]?.when).toEqual(['water', 'grass', 'ice'].map((type) => ({ kind: 'partyType', type, absent: true })));
    const run = chooseEvent(content, at('co-l15-shrine', 'wd'), 'x', 2).run;
    expect(f(run, 'wards-broken')).toBe(1);
  });
});
