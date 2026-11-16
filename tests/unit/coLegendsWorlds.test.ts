// Catalog Overhaul Pack (legends, batch 5 row B): the pseudo-stage worlds and the rift. New doors into the five worlds, the worlds'
// Legendaries, the Faller 3 Ultra Space door, The Rift Whisper's Renegade blessing and its Reverse Side, the Rival Ambush chain.
import { describe, expect, it } from 'vitest';
import { BLESSINGS, rollBlessing, runBlessing, takeBlessing } from '../../src/core/blessings';
import { chainById, chainRooms, PSEUDO } from '../../src/core/dungeon/pseudo';
import { chooseEvent } from '../../src/core/events';
import { REVERSE_USED, reverseSideProblem } from '../../src/core/legends/reverseSide';
import { syncLegendFlags } from '../../src/core/legends/signs';
import { nextChoices } from '../../src/core/map';
import { chooseNode, chooseStarter, createRun, stepToReverseSide } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import status from '../../src/data/catalogOverhaul/status/legends.json';
import thirteen from '../../src/data/events/co-legends-13.json';
import { content } from './helpers';

const ROW_B = ['mr-rift-whisper', 'dz-rival-ambush', ...['distortion-incident', 'dreamscape', 'distortion-world', 'ancient-wilds', 'celestial-expanse'].flatMap((w) => PSEUDO.records.find((r) => r.id === `ps_${w.replace(/-/g, '_')}`)!.nodes.map((n) => `ps-${w}-${n.id}`).concat(`ps-${w}-gate`))];

const newRun = (seed: string, blessing: string | null = 'tapu-lele'): RunState => {
  const run = structuredClone(chooseStarter(content, createRun(content, { runId: 'w', seed, archetypeId: 'red' }), 0));
  run.encountersCompleted = 2;
  if (blessing) run.expansion = { ...run.expansion, blessing: { id: blessing, tier: 'lesser', influence: 2, seen: true, ashRegions: [], communion: false, riteUsed: false, stagesDone: [] } };
  else run.expansion = { ...run.expansion, blessing: undefined } as never;
  syncLegendFlags(run);
  return run;
};
const at = (run: RunState, eventId: string): RunState => {
  const node = run.stage!.map.nodes[0]!;
  run.stage!.current = node.id;
  run.stage!.visited = [node.id];
  node.sides.push({ id: 'x', kind: 'event', used: false, eventId } as never);
  return run;
};
const toWild = (run: RunState): RunState => chooseNode(content, run, nextChoices(run.stage!).find((n) => n.kind === 'wild')!.id);
const renegade = (seed: string): RunState => {
  const run = newRun(seed);
  expect(takeBlessing(run, 'giratina')).toBe(true);
  syncLegendFlags(run);
  return run;
};
const gates = (run: RunState) => run.stage!.map.nodes.flatMap((n) => n.sides).filter((s) => s.eventId?.startsWith('ps-distortion')).map((s) => s.eventId);

describe('row B: the ledger ids', () => {
  it('all 33 are marked built and are live events', () => {
    expect(ROW_B).toHaveLength(33);
    for (const id of ROW_B) {
      expect((status as { built: Record<string, string> }).built[id], id).toBeTruthy();
      expect(content.events.get(id)?.disabled, id).toBeFalsy();
    }
  });
});

describe('the doors into the worlds', () => {
  it('each world has a live pseudo door that opens its gate, and every door offers a way to walk on', () => {
    const doors = { 'co-ps-wrong-sky': 'ps-distortion-incident-gate', 'co-ps-two-places': 'ps-distortion-world-gate', 'co-ps-new-moon': 'ps-dreamscape-gate', 'co-ps-area-zero': 'ps-ancient-wilds-gate', 'co-ps-star-stair': 'ps-celestial-expanse-gate' };
    for (const [door, gate] of Object.entries(doors)) {
      const e = content.events.get(door)!;
      expect(e.pseudo, door).toBe(true);
      expect(e.disabled, door).toBeFalsy();
      expect(JSON.stringify(e.choices), door).toContain(gate);
      expect(e.choices.some((c) => !JSON.stringify(c).includes(gate)), door).toBe(true);
    }
    const run = newRun('door');
    const after = chooseEvent(content, at(run, 'co-ps-wrong-sky'), 'x', 0).run;
    expect(after.stage!.map.nodes[0]!.sides.some((s) => s.eventId === 'ps-distortion-incident-gate')).toBe(true);
  });
  it("the worlds hold their Legendaries: Giratina, Darkrai and Cresselia, Koraidon and paradoxes, Rayquaza and Deoxys", () => {
    const rec = (id: string) => PSEUDO.records.find((r) => r.id === id)!;
    expect(rec('ps_distortion_incident').rare).toEqual(['giratina']);
    expect(rec('ps_distortion_world').rare).toEqual(['giratina']);
    expect(rec('ps_ancient_wilds').rare).toEqual(['koraidon']);
    expect(rec('ps_ancient_wilds').wild).toContain('great-tusk');
    expect(rec('ps_celestial_expanse').rare).toEqual(['rayquaza', 'deoxys']);
    const rare = content.events.get('ps-distortion-world-d')!;
    expect(rare.choices[0]!.success.battle).toMatchObject({ kind: 'wild', species: ['giratina'], pseudo: true });
    const dream = JSON.stringify(content.events.get('ps-dreamscape-d')!.choices);
    expect(dream).toContain('"darkrai"');
    expect(dream).toContain('"cresselia"');
    for (const r of PSEUDO.records) for (const s of [...r.wild, ...(r.rare ?? [])]) expect(content.species.has(s), s).toBe(true);
  });
  it('a Guidance of Giratina run reads the Distortion gates as the Division\'s rifts; a Renegade run as the Reverse Side', () => {
    for (const id of ['ps-distortion-incident-gate', 'ps-distortion-world-gate']) {
      const ids = content.events.get(id)!.remembers.map((v) => v.id);
      expect(ids).toEqual(['guidance', 'renegade']);
    }
  });
  it('the Celestial Expanse opens an Ultra Beast home world at Faller 3 and not before (boundary)', () => {
    const room = content.events.get('ps-celestial-expanse-c')!;
    const door = room.choices.find((c) => c.label === 'Climb past the last star')!;
    expect(door.requires).toEqual([{ kind: 'flag', key: 'faller-rank', atLeast: 3, atMost: 99 }]);
    const homes = (door.success.effects[0] as { ids: string[] }).ids;
    expect(homes.length).toBeGreaterThan(5);
    for (const h of homes) expect(content.events.get(h)?.room, h).toBe(true);
    const run = at(newRun('faller'), 'ps-celestial-expanse-c');
    const i = room.choices.indexOf(door);
    run.story.flags['ev:faller-rank'] = 2;
    expect(() => chooseEvent(content, run, 'x', i)).toThrow();
    run.story.flags['ev:faller-rank'] = 3;
    const after = chooseEvent(content, run, 'x', i).run;
    expect(after.stage!.map.nodes[0]!.sides.some((s) => homes.includes(s.eventId ?? ''))).toBe(true);
  });
});

describe('The Rift Whisper and The Renegade', () => {
  it('The Renegade is never rolled at run start, so no seed changes its blessing', () => {
    expect(BLESSINGS.find((b) => b.id === 'giratina')).toMatchObject({ tier: 'primordial', pool: false });
    for (let i = 0; i < 300; i++) expect(rollBlessing(`seed-${i}`)?.id).not.toBe('giratina');
  });
  it('accepting the bargain swaps the run\'s blessing for The Renegade and adds its Ghost price', () => {
    const run = newRun('whisper');
    const i = content.events.get('mr-rift-whisper')!.choices.findIndex((c) => c.label === 'Accept the bargain.');
    const after = chooseEvent(content, at(run, 'mr-rift-whisper'), 'x', i).run;
    expect(after.expansion?.blessing?.id).toBe('giratina');
    expect(runBlessing(after)?.name).toBe('The Renegade');
    expect(after.story.flags['ev:blessing-giratina']).toBe(1);
    expect(after.story.flags['ev:blessing-tapu-lele']).toBeUndefined();
    expect(after.perkEffects).toContainEqual({ kind: 'typeEncounterWeight', type: 'ghost', value: 1.5 });
  });
  it('with Blessings off the bargain is the old relic only (failure case: no blessing to replace)', () => {
    const run = newRun('whisper-off', null);
    const i = content.events.get('mr-rift-whisper')!.choices.findIndex((c) => c.label === 'Accept the bargain.');
    const after = chooseEvent(content, at(run, 'mr-rift-whisper'), 'x', i).run;
    expect(after.expansion?.blessing).toBeUndefined();
    expect(after.story.flags['ev:relic:rift-bargain'] ?? after.story.flags['relic:rift-bargain']).toBeTruthy();
  });
  it('Dialga\'s rewinds leave with its blessing', () => {
    const run = newRun('dialga', 'dialga');
    run.expansion = { ...run.expansion, rewind: { source: 'blessing' } } as never;
    takeBlessing(run, 'giratina');
    expect((run.expansion as { rewind?: unknown } | undefined)?.rewind).toBeUndefined();
  });
});

describe('the Reverse Side', () => {
  it('steps out of an ordinary battle once per stage: nothing won or lost, and the node opens on a Distortion world', () => {
    const run = toWild(renegade('rev'));
    expect(reverseSideProblem(run)).toBeNull();
    const xp = run.party.map((m) => m.xp);
    const res = stepToReverseSide(content, run)!;
    expect(res.run.phase).toBe('map');
    expect(res.run.battle).toBeNull();
    expect(res.run.money).toBe(run.money);
    expect(res.run.party.map((m) => m.xp)).toEqual(xp);
    expect(gates(res.run)).toEqual(['ps-distortion-incident-gate']);
    expect(res.run.story.flags[REVERSE_USED]).toBe(res.run.regionIndex * 100 + res.run.stage!.index + 1);
    // Boundary: the same stage again is refused.
    const again = toWild(res.run);
    expect(reverseSideProblem(again)).toBe('Once per stage.');
    expect(stepToReverseSide(content, again)).toBeNull();
  });
  it('the next stage opens the other world; past the pseudo-stage caps only the step-out happens', () => {
    const run = toWild(renegade('rev2'));
    run.story.flags['ev:reverse-side-worlds'] = 1;
    expect(gates(stepToReverseSide(content, run)!.run)).toEqual(['ps-distortion-world-gate']);
    const capped = toWild(renegade('rev3'));
    capped.itemCounters = { ...capped.itemCounters, [`pseudo-seen:${capped.regionIndex}`]: 1 };
    const out = stepToReverseSide(content, capped)!;
    expect(out.run.phase).toBe('map');
    expect(gates(out.run)).toEqual([]);
  });
  it('never in a boss\'s battle, an event battle, or without the blessing (failure cases)', () => {
    const boss = toWild(renegade('rev4'));
    boss.battle!.kind = 'trainer';
    boss.battle!.trainer = { classId: 'gym-leader', name: 'Brock' } as never;
    expect(reverseSideProblem(boss)).toBe('Not in a boss\'s battle.');
    const story = toWild(renegade('rev5'));
    story.battle!.event = { eventId: 'x', choiceIndex: 0, sideId: 'x', success: true };
    expect(reverseSideProblem(story)).toBe('This fight has to be finished.');
    expect(reverseSideProblem(toWild(newRun('rev6')))).toMatch(/Renegade/);
  });
});

describe('the Rival Ambush, Pseudo Stage form', () => {
  it('is a chain: the ambush opens a duel or a chase, and both reach the far side', () => {
    const chain = chainById('ps_rival_ambush')!;
    expect(chain.entry).toBe('dz-rival-ambush');
    const rooms = chainRooms(content, chain);
    expect(rooms.map((r) => r.event).sort()).toEqual(['dz-rival-ambush-chase', 'dz-rival-ambush-duel', 'dz-rival-ambush-trail']);
    expect(rooms.find((r) => r.event === 'dz-rival-ambush-trail')!.depth).toBe(2);
    // A loss never ends the run: the rival fights are friendly and still lead to the far side.
    for (const id of ['dz-rival-ambush-duel', 'dz-rival-ambush-chase']) {
      const json = JSON.stringify(content.events.get(id)!.choices);
      expect(json).toContain('"friendly":true');
      expect(json).toContain('dz-rival-ambush-trail');
    }
    expect(thirteen.events.filter((e) => e.id.startsWith('dz-rival-ambush-')).every((e) => (e as { room?: boolean }).room)).toBe(true);
  });
  it('choosing to fight steps into the meadow and stands on the duel', () => {
    const run = newRun('ambush');
    if (run.story.rivals.length === 0) run.story.rivals.push({ encounters: 1 } as never);
    for (const r of run.story.rivals) r.encounters = Math.max(1, r.encounters);
    const after = chooseEvent(content, at(run, 'dz-rival-ambush'), 'x', 0).run;
    expect(after.stage!.pseudo?.id).toBe('ps_rival_ambush');
    const here = after.stage!.map.nodes.find((n) => n.id === after.stage!.current)!;
    expect(here.roomEvent).toBe('dz-rival-ambush-duel');
  });
});
