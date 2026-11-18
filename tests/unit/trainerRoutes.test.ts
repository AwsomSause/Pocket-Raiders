// Streamlined trainer unlocks: every trainer has one clear route, met challenges join on their own,
// Gym Leaders / Elite Four / Champions join when beaten as a boss, and any owned trainer can lead a run.

import { describe, expect, it } from 'vitest';
import { createPokemon } from '../../src/core/pokemon';
import { createProfile, finalizeRun } from '../../src/core/profile';
import { joinEarnedTrainers, ownsTrainer, trainerStatus } from '../../src/core/progress';
import { resolvePrep, defaultPrep } from '../../src/core/runPrep';
import { chooseReward, chooseStarter, createRun, resolveDecision, takeTurn } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { content, toBattle } from './helpers';

const NOW = '2026-11-16T00:00:00Z';

function newRun(seed: string, archetypeId = 'red'): RunState {
  return chooseStarter(content, createRun(content, { runId: `run-${seed}`, seed, archetypeId, campaignId: 'full' }), 0);
}

describe('trainer unlock routes', () => {
  it('gives each trainer one route; no trainer costs Bank Credits', () => {
    const routes = new Map<string, number>();
    for (const a of content.archetypes.values()) {
      routes.set(a.unlockRoute, (routes.get(a.unlockRoute) ?? 0) + 1);
      expect(a.unlockCost, a.id).toBe(0);
      if (a.unlockedByDefault) expect(a.unlockRoute, a.id).toBe('start');
      if (a.unlockRoute === 'battle') expect(content.bosses.has(a.id), a.id).toBe(true);
      if (a.unlockRoute === 'battle' || a.unlockRoute === 'event') expect(a.unlockText, a.id).toMatch(a.unlockRoute === 'battle' ? /^Beat .+ in a boss battle/ : /^Help .+ in a run event/);
    }
    expect(routes.get('start')).toBe(5);
    expect(routes.get('battle')).toBeGreaterThan(100);
    expect(routes.get('event')).toBeGreaterThan(40);
    expect(routes.get('challenge')).toBeGreaterThan(20);
  });

  it('a met challenge owns the trainer at once and is written to the roster at run end', () => {
    const aaron = [...content.archetypes.values()].find((a) => a.unlockRoute === 'challenge' && a.unlock?.kind === 'total')!;
    const p = createProfile(content, 'p');
    expect(trainerStatus(p, aaron)).toBe('locked');
    const req = aaron.unlock as { counter: string; atLeast: number };
    p.counters[req.counter] = req.atLeast;
    p.best[req.counter] = req.atLeast;
    expect(ownsTrainer(p, aaron)).toBe(true);
    joinEarnedTrainers(content, p);
    expect(p.unlockedArchetypes).toContain(aaron.id);
  });

  it('beating a Gym Leader as a boss recruits them, and they join when the run ends', () => {
    let run = newRun('route-boss');
    let guard = 0;
    const recruits = (r: RunState) => Object.keys(r.itemCounters ?? {}).filter((k) => k.startsWith('recruit:'));
    while (recruits(run).length === 0 && run.phase !== 'over' && guard++ < 120) {
      const mon = createPokemon(content, 'houndoom', 100, run.party[0]!.uid);
      mon.moves = [{ id: 'flamethrower', pp: 64 }, { id: 'crunch', pp: 64 }];
      run.party[0] = mon;
      run = toBattle(run);
      let turns = 0;
      while (run.phase === 'battle' && turns++ < 300) run = takeTurn(content, run, { kind: 'move', index: 0 }).run;
      while (run.phase === 'decision') run = resolveDecision(content, run, run.pending[0]!.kind === 'caught' ? { kind: 'release' } : run.pending[0]!.kind === 'evolve' ? { kind: 'evolve', accept: true } : { kind: 'skipMove' }).run;
      if (run.phase === 'reward') run = chooseReward(content, run, 0).run;
    }
    expect(run.log.counters.gymLeadersDefeated ?? 0).toBeGreaterThan(0);
    const recruited = recruits(run);
    expect(recruited.length).toBe(1);
    const id = recruited[0]!.slice('recruit:'.length);
    expect(content.archetypes.get(id)?.unlockRoute).toBe('battle');
    const { profile, summary } = finalizeRun(content, createProfile(content, 'p'), { ...run, phase: 'over' }, NOW);
    expect(profile.unlockedArchetypes).toContain(id);
    expect(summary!.trainersReady.map((a) => a.id)).toContain(id);
  });

  it('any owned trainer can lead a run (the picker is no longer limited to the starting five)', () => {
    const p = createProfile(content, 'p');
    expect(resolvePrep(content, p, 'misty', defaultPrep(content)).problems.join(' ')).toMatch(/isn't available/);
    p.unlockedArchetypes.push('misty');
    expect(resolvePrep(content, p, 'misty', defaultPrep(content)).problems.join(' ')).not.toMatch(/isn't available/);
    for (const id of ['red', 'blue', 'green', 'hilda', 'nate']) expect(ownsTrainer(p, content.archetypes.get(id)!), id).toBe(true);
  });
});
