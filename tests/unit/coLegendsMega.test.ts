// Catalog Overhaul Pack (legends): the Mega Anomalies M1 to M6 (co-legends-2.json) and the region's Anomaly meter.
import { describe, expect, it } from 'vitest';
import { chainRooms, PSEUDO_CHAINS } from '../../src/core/dungeon/pseudo';
import { chooseEvent } from '../../src/core/events';
import { syncLegendFlags } from '../../src/core/legends/signs';
import { chooseStarter, createRun } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import file from '../../src/data/events/co-legends-2.json';
import status from '../../src/data/catalogOverhaul/status/legends.json';
import placement from '../../src/data/catalogOverhaul/placement/legends.json';
import { content } from './helpers';

const ENTRIES = { M1: 'co-m1-absol', M2: 'co-m2-harvest', M3: 'co-m3-twins', M4: 'co-m4-mirror', M5: 'co-m5-tatsugiri', M6: 'co-m6-flower' };

function at(eventId: string, seed: string, setup?: (run: RunState) => void): RunState {
  const run = structuredClone(chooseStarter(content, createRun(content, { runId: 'mg', seed, archetypeId: 'red' }), 0));
  const node = run.stage!.map.nodes[0]!;
  run.stage!.current = node.id;
  run.stage!.visited = [node.id];
  node.sides.push({ id: 'x', kind: 'event', used: false, eventId } as never);
  setup?.(run);
  return run;
}

const f = (run: RunState, key: string) => run.story.flags[`ev:${key}`] ?? 0;
const pick = (run: RunState, eventId: string, choice: number): RunState => {
  const side = run.stage!.map.nodes[0]!.sides.find((s) => s.kind === 'event' && !s.used && (s as { eventId?: string }).eventId === eventId)!;
  return chooseEvent(content, run, side.id, choice).run;
};

describe('Mega Anomalies M1 to M6', () => {
  it('each Anomaly has an entry event, a status line and a placement', () => {
    const extra = (status as { extra?: Record<string, string> }).extra ?? {};
    for (const [code, id] of Object.entries(ENTRIES)) {
      expect(content.events.get(id), id).toBeDefined();
      expect(extra[code], code).toBe(id);
      expect((placement as Record<string, unknown>)[id], id).toBeDefined();
    }
  });

  it('every scene Pokémon and every wild or gift species exists, and every room points at a real event', () => {
    const text = JSON.stringify(file);
    for (const m of text.matchAll(/"pokemon":"([^"]+)"/g)) expect(content.species.has(m[1]!), m[1]).toBe(true);
    for (const m of text.matchAll(/"species":\[([^\]]*)\]/g)) for (const s of JSON.parse(`[${m[1]}]`) as string[]) expect(content.species.has(s), s).toBe(true);
    for (const m of text.matchAll(/"kind":"(?:room|laterEvent)","eventId":"([^"]+)"/g)) expect(content.events.get(m[1]!), m[1]).toBeDefined();
  });

  it('the Anomaly meter starts at 0 in each region and keeps its count inside one region', () => {
    const run = at('co-m1-absol', 'meter');
    run.story.flags['ev:mega-meter'] = 3;
    run.story.flags['ev:mega-meter-region'] = run.regionIndex + 1;
    syncLegendFlags(run);
    expect(run.story.flags['ev:mega-meter']).toBe(3);
    run.regionIndex += 1;
    syncLegendFlags(run);
    expect(run.story.flags['ev:mega-meter'] ?? 0).toBe(0);
    expect(run.story.flags['ev:mega-meter-region']).toBe(run.regionIndex + 1);
  });

  it('M3: the "let your Charizard go to it" choice needs a Charizard in the party', () => {
    const scorched = content.events.get('co-m3-scorched')!;
    const idx = scorched.choices.findIndex((c) => c.requires?.some((r) => r.kind === 'partySpecies'));
    expect(idx).toBeGreaterThanOrEqual(0);
    const run = at('co-m3-scorched', 'twins', (r) => { r.story.flags['ev:twins-one'] = 1; });
    expect(() => chooseEvent(content, run, 'x', idx)).toThrow();
  });

  it('M4 is a Door: its ruin is a pseudo chain whose rooms run 1, 2, 3 to the central room and walk out', () => {
    const chain = PSEUDO_CHAINS.find((c) => c.entry === 'co-m4-mirror')!;
    expect(chain).toBeDefined();
    const rooms = chainRooms(content, chain);
    const ids = rooms.map((r) => r.event);
    for (const id of ['co-m4-room-1', 'co-m4-room-2', 'co-m4-room-3', 'co-m4-centre']) expect(ids, id).toContain(id);
    expect(rooms.some((r) => r.next.length === 0)).toBe(true);
    const run = chooseEvent(content, at('co-m4-mirror', 'mirror'), 'x', 0).run;
    expect(run.story.flags['ev:mirror-started']).toBe(1);
  });
});

describe('M7 Mega Without a Stone (a rival episode)', () => {
  const effectsOf = (o: { effects?: unknown[] } | undefined): string => JSON.stringify(o?.effects ?? []);
  it('needs a met rival and a free rival slot, and every way through the opening takes the slot', () => {
    const glow = content.events.get('co-m7-glow')!;
    expect(glow.requires).toContainEqual(expect.objectContaining({ kind: 'rivalQuest', slotFree: true }));
    expect(glow.requires).toContainEqual({ kind: 'rivalMet', atLeast: 1 });
    for (const c of glow.choices) expect(effectsOf(c.success), c.label).toContain('"takeSlot":true');
    for (const c of content.events.get('co-m7-loose')!.choices) expect(effectsOf(c.success), c.label).toContain('"takeSlot":true');
    expect(content.items.has('mega-ring')).toBe(true);
    expect((status as { extra: Record<string, string> }).extra.M7).toBe('co-m7-glow');
    expect((placement as Record<string, unknown>)['co-m7-glow']).toBeDefined();
  });

  it('your opinion counts only at Trust 4+; under it the rival decides (no rival here: they keep it)', () => {
    const finding = content.events.get('co-m7-finding')!;
    expect(finding.choices[0]!.requires).toContainEqual(expect.objectContaining({ kind: 'rivalQuest', feeling: expect.objectContaining({ key: 'trust', atLeast: 4 }) }));
    expect(finding.choices[1]!.requires).toEqual(finding.choices[0]!.requires);
    let run = at('co-m7-ace', 'm7');
    run = pick(run, 'co-m7-ace', 0);
    run = pick(run, 'co-m7-sample', 0);
    expect(f(run, 'rival-mega-helped')).toBe(1);
    run = pick(run, 'co-m7-finding', 2); // Seal and Keep need Trust 4: only "It's your choice" can be taken
    expect([f(run, 'rival-mega-kept'), f(run, 'rival-mega-done')]).toEqual([1, 1]);
  });

  it('a kept stoneless Mega runs out of control at meter 5, once', () => {
    const loose = content.events.get('co-m7-loose')!;
    expect(loose.requires).toContainEqual(expect.objectContaining({ key: 'rival-mega-kept', atLeast: 1 }));
    expect(loose.requires).toContainEqual(expect.objectContaining({ key: 'mega-meter', atLeast: 5 }));
    expect(loose.requires).toContainEqual(expect.objectContaining({ key: 'rival-mega-calmed', atMost: 0 }));
  });
});
