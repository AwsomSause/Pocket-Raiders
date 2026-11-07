import { describe, expect, it } from 'vitest';
import { applyInterference, INTERFERENCE } from '../../src/core/rivals/interference';
import { chooseStarter, createRun, rivalInterfere } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import type { Rival } from '../../src/core/story/schema';
import { content } from './helpers';

const rival = (id: string, state: Rival['state']): Rival => ({
  id, classId: 'youngster', name: id, archetype: 'proud', style: 'rush', traits: { ambition: 50, pride: 50, empathy: 50, adaptability: 50, vindictiveness: 80, resilience: 50 },
  rivalPotential: 30, state, arc: null, away: 0, cooldown: 0, progress: 0, encounters: 2, setbacks: 0, adaptations: [], bonds: {}, offscreen: [],
  origin: { eventId: `e-${id}`, where: { region: 0, stage: 0, level: 1, node: null, battle: 0, turn: null }, path: 'x' },
  memory: { lastBattle: { eventId: 'x', result: 'win', hpLeftShare: 0.5, turns: 5, team: [] } },
}) as Rival;

function stop(seed: string, kind: 'heal' | 'event', state: Rival['state']): RunState {
  const run = structuredClone(chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red' }), 0));
  const stage = run.stage!;
  const node = stage.map.nodes.find((n) => n.kind === 'wild' || n.kind === 'trainer')!;
  node.sides.push({ id: 's1', kind, used: false, ...(kind === 'event' ? { eventId: 'x' } : {}) });
  stage.current = node.id;
  stage.index = 3;
  run.money = 1000;
  run.story.rivals = [rival('r1', state)];
  return run;
}

describe('rival interference (11.1)', () => {
  it('foes steal or block, friends assist, once per stage, and the run never ends', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 200; i++) {
      for (const [state, expected] of [['nemesis', ['steal', 'block']], ['ally', ['assist']]] as const) {
        const run = stop(`if${i}`, i % 2 ? 'heal' : 'event', state);
        const hit = applyInterference(run, 's1');
        if (!hit) continue;
        expect(expected).toContain(hit.kind);
        seen.add(hit.kind);
        expect(hit.run.phase).toBe('map');
        if (hit.kind === 'steal') expect(hit.run.money).toBe(1000 - Math.min(INTERFERENCE.stealMax, 100));
        if (hit.kind === 'block') expect(hit.run.stage!.map.nodes.flatMap((n) => n.sides).find((s) => s.id === 's1')!.used).toBe(true);
        if (hit.kind === 'assist') expect(hit.run.inventory.potion).toBe((run.inventory.potion ?? 0) + 1);
        expect(applyInterference(hit.run, 's1')).toBeNull(); // once per stage
        expect(rivalInterfere(hit.run, 's1')).toBeNull();
      }
    }
    expect([...seen].sort()).toEqual(['assist', 'block', 'steal']);
  });

  it('is seeded, leaves the run alone when it does not fire, and skips the League, boss nodes and used stops', () => {
    for (let i = 0; i < 40; i++) {
      const a = stop(`sd${i}`, 'event', 'nemesis');
      const before = JSON.stringify(a);
      const r1 = applyInterference(a, 's1');
      expect(JSON.stringify(a)).toBe(before);
      expect(applyInterference(stop(`sd${i}`, 'event', 'nemesis'), 's1')?.text).toBe(r1?.text);
      const league = stop(`lg${i}`, 'event', 'nemesis');
      league.stage!.kind = 'league';
      expect(applyInterference(league, 's1')).toBeNull();
      const boss = stop(`bs${i}`, 'event', 'nemesis');
      boss.stage!.map.nodes.find((n) => n.id === boss.stage!.current)!.kind = 'gym';
      expect(applyInterference(boss, 's1')).toBeNull();
      const used = stop(`us${i}`, 'event', 'nemesis');
      used.stage!.map.nodes.flatMap((n) => n.sides).find((s) => s.id === 's1')!.used = true;
      expect(applyInterference(used, 's1')).toBeNull();
    }
  });
});
